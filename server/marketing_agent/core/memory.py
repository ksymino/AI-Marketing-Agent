"""
Shared memory and context store for agent collaboration
"""
import json
import os
from typing import Any, Dict, Optional, List
from datetime import datetime
from pathlib import Path


class SharedMemory:
    """
    Shared memory store for inter-agent communication and state management.
    Uses JSON files for persistence in this implementation.
    Can be extended to use Redis, MongoDB, or other storage backends.
    """
    
    def __init__(self, storage_path: str = "./data/memory"):
        """
        Initialize shared memory
        
        Args:
            storage_path: Path to store memory files
        """
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.session_id: Optional[str] = None
        self.memory: Dict[str, Any] = {}
        
    def create_session(self, session_id: Optional[str] = None) -> str:
        """
        Create a new session
        
        Args:
            session_id: Optional session ID, auto-generated if not provided
            
        Returns:
            Session ID
        """
        if session_id is None:
            session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.session_id = session_id
        self.memory = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "brand_profile": None,
            "brand_analysis": None,
            "content_assets": None,
            "campaign_plan": None,
            "campaign_results": None,
            "workflow_state": "pending",
            "messages": [],
            "metadata": {}
        }
        self._persist()
        return session_id
    
    def load_session(self, session_id: str) -> bool:
        """
        Load an existing session
        
        Args:
            session_id: Session ID to load
            
        Returns:
            True if session loaded successfully, False otherwise
        """
        session_file = self.storage_path / f"{session_id}.json"
        if not session_file.exists():
            return False
        
        with open(session_file, 'r', encoding='utf-8') as f:
            self.memory = json.load(f)
        
        self.session_id = session_id
        return True
    
    def save(self, key: str, value: Any) -> None:
        """
        Save a value to shared memory
        
        Args:
            key: Memory key
            value: Value to save (must be JSON serializable)
        """
        if self.session_id is None:
            raise RuntimeError("No active session. Call create_session() first.")
        
        # Convert Pydantic models to dict
        if hasattr(value, 'model_dump'):
            value = value.model_dump()
        elif hasattr(value, 'dict'):
            value = value.dict()
        
        self.memory[key] = value
        self.memory["updated_at"] = datetime.now().isoformat()
        self._persist()
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Retrieve a value from shared memory
        
        Args:
            key: Memory key
            default: Default value if key not found
            
        Returns:
            Stored value or default
        """
        return self.memory.get(key, default)
    
    def update(self, updates: Dict[str, Any]) -> None:
        """
        Update multiple values at once
        
        Args:
            updates: Dictionary of key-value pairs to update
        """
        for key, value in updates.items():
            self.save(key, value)
    
    def append_message(self, message: Dict[str, Any]) -> None:
        """
        Append a message to the message log
        
        Args:
            message: Message to append
        """
        if "messages" not in self.memory:
            self.memory["messages"] = []
        
        if hasattr(message, 'model_dump'):
            message = message.model_dump()
        
        self.memory["messages"].append(message)
        self._persist()
    
    def get_messages(self, from_agent: Optional[str] = None, 
                     to_agent: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve messages, optionally filtered by sender/receiver
        
        Args:
            from_agent: Filter by sender agent
            to_agent: Filter by receiver agent
            
        Returns:
            List of messages
        """
        messages = self.memory.get("messages", [])
        
        if from_agent:
            messages = [m for m in messages if m.get("from_agent") == from_agent]
        
        if to_agent:
            messages = [m for m in messages if m.get("to_agent") == to_agent]
        
        return messages
    
    def set_workflow_state(self, state: str) -> None:
        """
        Update workflow state
        
        Args:
            state: New workflow state
        """
        self.save("workflow_state", state)
    
    def get_workflow_state(self) -> str:
        """
        Get current workflow state
        
        Returns:
            Current workflow state
        """
        return self.get("workflow_state", "pending")
    
    def clear(self) -> None:
        """Clear current session memory"""
        if self.session_id:
            self.memory = {
                "session_id": self.session_id,
                "created_at": datetime.now().isoformat(),
                "cleared_at": datetime.now().isoformat()
            }
            self._persist()
    
    def _persist(self) -> None:
        """Persist memory to disk"""
        if self.session_id is None:
            return
        
        session_file = self.storage_path / f"{self.session_id}.json"
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(self.memory, f, indent=2, ensure_ascii=False, default=str)
    
    def list_sessions(self) -> List[str]:
        """
        List all available sessions
        
        Returns:
            List of session IDs
        """
        return [f.stem for f in self.storage_path.glob("*.json")]
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session
        
        Args:
            session_id: Session ID to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        session_file = self.storage_path / f"{session_id}.json"
        if session_file.exists():
            session_file.unlink()
            return True
        return False
    
    def export_session(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Export session data
        
        Args:
            session_id: Session ID to export, uses current session if not provided
            
        Returns:
            Session data dictionary
        """
        if session_id and session_id != self.session_id:
            session_file = self.storage_path / f"{session_id}.json"
            with open(session_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        return self.memory.copy()


class VectorMemory:
    """
    Vector-based memory for semantic search and retrieval.
    Uses embeddings to store and retrieve contextually relevant information.
    """
    
    def __init__(self, collection_name: str = "marketing_agent"):
        """
        Initialize vector memory
        
        Args:
            collection_name: Name of the vector collection
        """
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        
    def initialize(self):
        """Initialize vector database connection"""
        try:
            import chromadb
            from chromadb.config import Settings
            
            self.client = chromadb.Client(Settings(
                persist_directory="./data/chroma",
                anonymized_telemetry=False
            ))
            
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Marketing agent knowledge base"}
            )
        except ImportError:
            print("Warning: chromadb not installed. Vector memory disabled.")
    
    def add_document(self, doc_id: str, text: str, metadata: Optional[Dict] = None):
        """
        Add a document to vector memory
        
        Args:
            doc_id: Unique document ID
            text: Document text
            metadata: Optional metadata
        """
        if self.collection is None:
            return
        
        self.collection.add(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata or {}]
        )
    
    def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant documents
        
        Args:
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant documents with metadata
        """
        if self.collection is None:
            return []
        
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return [
            {
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if "distances" in results else None
            }
            for i in range(len(results["ids"][0]))
        ]
    
    def clear(self):
        """Clear all documents from collection"""
        if self.collection and self.client:
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.create_collection(self.collection_name)
