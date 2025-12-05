import { invokeLLM } from '../_core/llm';

export interface WebsiteContent {
  url: string;
  title: string;
  description: string;
  mainContent: string;
  keywords: string[];
  productInfo: string;
}

/**
 * Scrape and analyze website content using real browser rendering
 * This function actually visits the website and extracts visible content
 */
export async function scrapeWebsiteContent(url: string): Promise<WebsiteContent> {
  try {
    console.log(`[WebsiteScraper] Starting to scrape: ${url}`);
    
    // Use fetch to get the HTML content
    // Note: For production, consider using a headless browser service or Puppeteer
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[WebsiteScraper] Fetched HTML (${html.length} characters)`);

    // Extract text content from HTML using LLM
    // Truncate HTML to avoid token limits (keep first 20000 chars which is ~5000 tokens)
    const truncatedHtml = html.substring(0, 20000);
    
    const extractionPrompt = `Extract key brand information from this website HTML.

HTML Content:
${truncatedHtml}

Analyze the VISIBLE TEXT CONTENT (ignore HTML tags, scripts, styles) and extract:

1. **Brand/Company Name**: The main organization name
2. **Description**: What the organization does (1-2 sentences)
3. **Main Content**: Key offerings, products, or services (2-3 sentences)
4. **Keywords**: 5-10 relevant keywords that describe the brand
5. **Product/Service Info**: Specific products or services mentioned

Return ONLY valid JSON in this exact format:
{
  "title": "Brand or organization name",
  "description": "Brief description",
  "mainContent": "Summary of main offerings",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "productInfo": "Products or services offered"
}`;

    const llmResponse = await invokeLLM({
      messages: [
        { 
          role: 'system', 
          content: 'You are a web content analyzer. Extract structured brand information from HTML. Focus on visible text content, not HTML markup. Always return valid JSON.' 
        },
        { role: 'user', content: extractionPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'website_content',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Brand or organization name' },
              description: { type: 'string', description: 'Brief description of what they do' },
              mainContent: { type: 'string', description: 'Summary of main offerings' },
              keywords: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Relevant keywords'
              },
              productInfo: { type: 'string', description: 'Products or services offered' }
            },
            required: ['title', 'description', 'mainContent', 'keywords', 'productInfo'],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = llmResponse.choices[0]?.message?.content;
    const contentString = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const extracted = JSON.parse(contentString || '{}');

    console.log(`[WebsiteScraper] Successfully extracted brand info for: ${extracted.title}`);

    return {
      url,
      title: extracted.title || 'Unknown Brand',
      description: extracted.description || '',
      mainContent: extracted.mainContent || '',
      keywords: extracted.keywords || [],
      productInfo: extracted.productInfo || ''
    };

  } catch (error: any) {
    console.error('[WebsiteScraper] Failed to scrape website:', error.message);
    
    // Return minimal info if scraping fails
    return {
      url,
      title: 'Unable to fetch website',
      description: `Could not retrieve content from ${url}. Error: ${error.message}`,
      mainContent: 'Website content could not be analyzed. Please check the URL and try again.',
      keywords: [],
      productInfo: ''
    };
  }
}
