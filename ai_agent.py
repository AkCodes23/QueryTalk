import os
import json
import logging
import google.generativeai as genai
from sqlalchemy import text
from app import db
from config import GEMINI_API_KEY, DB_SCHEMA_DESCRIPTION, CHART_TYPES

# Set up logging
logger = logging.getLogger(__name__)

# Configure the Gemini API
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found. AI features will not work.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

def get_chart_recommendation(query_type, data_shape):
    """
    Recommend a chart type based on the query and data
    
    Args:
        query_type: The type of query (time series, comparison, etc.)
        data_shape: The shape of the data (number of rows, columns)
    
    Returns:
        A dictionary with chart type and configuration
    """
    # Default chart type
    chart_type = CHART_TYPES["BAR"]
    
    # Simple chart type recommendation logic
    if "trend" in query_type.lower() or "over time" in query_type.lower():
        chart_type = CHART_TYPES["LINE"]
    elif "distribution" in query_type.lower() or "percentage" in query_type.lower():
        chart_type = CHART_TYPES["PIE"] if data_shape[0] < 8 else CHART_TYPES["BAR"]
    elif "comparison" in query_type.lower():
        chart_type = CHART_TYPES["BAR"]
        
    return {
        "type": chart_type,
        "options": {
            "responsive": True,
            "maintainAspectRatio": False
        }
    }

def process_voice_query(query_text, language_code='en'):
    """
    Process a natural language query using Gemini AI and convert it to SQL
    
    Args:
        query_text: The natural language query text
        language_code: The language code of the query (e.g., 'en', 'hi', 'de', 'ja')
    
    Returns:
        A dictionary with the generated SQL, explanation, and suggested next queries
    """
    # Check if environment has GEMINI_API_KEY
    import os
    api_key = os.environ.get("GEMINI_API_KEY")
    logger.debug(f"GEMINI_API_KEY available: {bool(api_key)}")
    
    if not api_key:
        logger.error("GEMINI_API_KEY not provided in environment. Cannot process query.")
        return None
        
    # Set language-specific messages based on the language code
    explanation_label = "explanation"
    chart_type_label = "chart_type"  
    suggested_queries_label = "suggested_queries"
    query_type_label = "query_type"
    
    # Language-specific prompt templates
    language_prompts = {
        'en': f"""
        You are a business intelligence assistant that converts natural language queries into SQL.
        
        DATABASE SCHEMA:
        {DB_SCHEMA_DESCRIPTION}
        
        USER QUERY: "{query_text}"
        
        Generate a valid SQL query to answer this question. Then provide a brief explanation of what the query does and suggest 3 follow-up questions the user might want to ask next.
        
        Format your response as a JSON object with the following keys:
        - "sql": The SQL query to execute
        - "explanation": A simple explanation of what the query does
        - "chart_type": Recommended chart type (one of: "bar", "line", "pie")
        - "suggested_queries": An array of 3 suggested follow-up questions
        - "query_type": The type of analysis being performed (e.g., "time_series", "comparison", "distribution")
        
        The SQL should be valid and should work with PostgreSQL. Use only tables and columns from the schema above.
        """,
        
        'hi': f"""
        आप एक बिजनेस इंटेलिजेंस सहायक हैं जो प्राकृतिक भाषा क्वेरी को SQL में बदलता है।
        
        डेटाबेस स्कीमा:
        {DB_SCHEMA_DESCRIPTION}
        
        उपयोगकर्ता क्वेरी: "{query_text}"
        
        इस प्रश्न का उत्तर देने के लिए एक वैध SQL क्वेरी जनरेट करें। फिर क्वेरी क्या करती है इसका संक्षिप्त विवरण प्रदान करें और 3 फॉलो-अप प्रश्न सुझाएं जो उपयोगकर्ता अगले पूछ सकता है।
        
        कृपया केवल एक वैध SQL क्वेरी जेनरेट करें, जो टिप्पणियों से शुरू न हो। कृपया सिर्फ टिप्पणियों (-- के साथ शुरू होने वाली पंक्तियां) से बनी SQL न दें।
        
        अपने जवाब को निम्न कीस वाले JSON ऑब्जेक्ट के रूप में फॉर्मेट करें:
        - "sql": चलाने के लिए SQL क्वेरी (-- टिप्पणियां नहीं, सिर्फ वैध SQL)
        - "explanation": क्वेरी क्या करती है इसका एक सरल स्पष्टीकरण
        - "chart_type": अनुशंसित चार्ट प्रकार (इनमें से एक: "bar", "line", "pie")
        - "suggested_queries": 3 सुझाए गए फॉलो-अप प्रश्नों का एक ऐरे
        - "query_type": किए जा रहे विश्लेषण का प्रकार (जैसे, "time_series", "comparison", "distribution")
        
        SQL PostgreSQL के साथ काम करने वाली और वैध होनी चाहिए। केवल उपरोक्त स्कीमा से टेबल और कॉलम का उपयोग करें।
        
        यदि क्वेरी का अर्थ स्पष्ट नहीं है, तो किसी भी मामले में एक वैध SQL क्वेरी देना चाहिए जो बिक्री, उत्पाद या ग्राहक डेटा का विश्लेषण करती है। कभी भी केवल टिप्पणियों से युक्त SQL न दें।
        """,
        
        'de': f"""
        Sie sind ein Business Intelligence-Assistent, der natürlichsprachige Anfragen in SQL umwandelt.
        
        DATENBANKSCHEMA:
        {DB_SCHEMA_DESCRIPTION}
        
        BENUTZERANFRAGE: "{query_text}"
        
        Generieren Sie eine gültige SQL-Abfrage, um diese Frage zu beantworten. Geben Sie dann eine kurze Erklärung, was die Abfrage macht, und schlagen Sie 3 Folgefragen vor, die der Benutzer als nächstes stellen könnte.
        
        Bitte generieren Sie nur eine gültige SQL-Abfrage, die nicht mit Kommentaren beginnt. Bitte geben Sie keine SQL zurück, die nur aus Kommentaren (Zeilen, die mit -- beginnen) besteht.
        
        Formatieren Sie Ihre Antwort als JSON-Objekt mit den folgenden Schlüsseln:
        - "sql": Die auszuführende SQL-Abfrage (keine -- Kommentare, nur gültiges SQL)
        - "explanation": Eine einfache Erklärung, was die Abfrage macht
        - "chart_type": Empfohlener Diagrammtyp (einer von: "bar", "line", "pie")
        - "suggested_queries": Ein Array von 3 vorgeschlagenen Folgefragen
        - "query_type": Die Art der durchgeführten Analyse (z.B. "time_series", "comparison", "distribution")
        
        Das SQL sollte gültig sein und mit PostgreSQL funktionieren. Verwenden Sie nur Tabellen und Spalten aus dem obigen Schema.
        
        Wenn der Zweck der Anfrage unklar ist, geben Sie in jedem Fall eine gültige SQL-Abfrage zurück, die Verkaufs-, Produkt- oder Kundendaten analysiert. Geben Sie niemals SQL zurück, das nur aus Kommentaren besteht.
        """,
        
        'ja': f"""
        あなたは自然言語クエリをSQLに変換するビジネスインテリジェンスアシスタントです。
        
        データベーススキーマ:
        {DB_SCHEMA_DESCRIPTION}
        
        ユーザークエリ: "{query_text}"
        
        この質問に答えるための有効なSQLクエリを生成してください。次に、クエリが何をするのかの簡単な説明と、ユーザーが次に尋ねるかもしれない3つのフォローアップ質問を提案してください。
        
        コメントから始まらない有効なSQLクエリのみを生成してください。コメント（--で始まる行）だけで構成されるSQLを返さないでください。
        
        次のキーを持つJSONオブジェクトとして応答をフォーマットしてください:
        - "sql": 実行するSQLクエリ（--コメントではなく、有効なSQLのみ）
        - "explanation": クエリが何をするのかの簡単な説明
        - "chart_type": 推奨チャートタイプ（"bar"、"line"、"pie"のいずれか）
        - "suggested_queries": 3つの提案されるフォローアップ質問の配列
        - "query_type": 実行される分析のタイプ（例: "time_series", "comparison", "distribution"）
        
        SQLはPostgreSQLで動作する有効なものである必要があります。上記のスキーマのテーブルと列のみを使用してください。
        
        クエリの目的が不明確な場合でも、必ず販売、製品、または顧客データを分析する有効なSQLクエリを返してください。コメントのみで構成されるSQLは決して返さないでください。
        """
    }
    
    # Get the appropriate prompt for the language or use English as fallback
    prompt = language_prompts.get(language_code, language_prompts['en'])

    try:
        # Configure the Gemini API with the key from environment
        genai.configure(api_key=api_key)
        
        logger.debug(f"Using prompt in language: {language_code}")
        
        logger.debug(f"Sending prompt to Gemini API: {prompt[:100]}...")
        
        # Configure the Gemini model
        generation_config = {
            "temperature": 0.2,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Generate response from Gemini
        # Use gemini-2.0-flash as primary model, with fallbacks
        model_names = ["gemini-2.0-flash", "models/gemini-2.0-flash", "models/gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"]
        
        response = None
        for model_name in model_names:
            try:
                logger.debug(f"Trying Gemini model: {model_name}")
                model = genai.GenerativeModel(
                    model_name=model_name,
                    generation_config=generation_config
                )
                
                response = model.generate_content(prompt)
                logger.debug(f"Successfully used model: {model_name}")
                break
            except Exception as e:
                logger.debug(f"Failed to use model {model_name}: {str(e)}")
                if model_name == model_names[-1]:  # If this is the last model we're trying
                    raise  # Re-raise the exception if all models failed
                continue  # Try the next model
                
        if not response:
            raise Exception("Failed to get response from any Gemini model")
        
        # Parse the response
        response_text = response.text
        logger.debug(f"Raw AI response received: {response_text[:100]}...")
        
        # Extract JSON from the response
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text.strip()
        
        logger.debug(f"Extracted JSON from AI response: {json_str[:100]}...")
        
        # Parse JSON response
        result = json.loads(json_str)
        
        # Check if the SQL is just a comment or empty
        sql = result["sql"].strip()
        if sql.startswith('--') and not any(line.strip() and not line.strip().startswith('--') for line in sql.split('\n')):
            # This is just a comment, probably an error message or misunderstood query
            logger.warning(f"Received SQL with only comments: {sql}")
            # Use fallback SQL generation
            fallback_result = generate_fallback_sql(query_text)
            if fallback_result:
                logger.info("Successfully generated SQL using fallback method after receiving comment-only SQL")
                return fallback_result
            else:
                raise ValueError(f"Unable to process query: received comments-only SQL and fallback generation failed")
        
        # Return the structured result
        response_data = {
            "sql": sql,
            "explanation": result["explanation"],
            "chart_type": result.get("chart_type", "bar"),
            "suggested_queries": result["suggested_queries"],
            "query_type": result.get("query_type", "general")
        }
        
        logger.debug(f"Successfully processed query with AI: {result.get('chart_type', 'bar')} chart")
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing query with AI: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Try a fallback implementation using templates if Gemini API fails
        try:
            logger.info("Attempting to use fallback SQL generation")
            fallback_result = generate_fallback_sql(query_text)
            if fallback_result:
                logger.info("Successfully generated SQL using fallback method")
                return fallback_result
        except Exception as fallback_err:
            logger.error(f"Fallback SQL generation also failed: {str(fallback_err)}")
        
        return None

def generate_fallback_sql(query_text):
    """
    A fallback method to generate SQL queries based on simple pattern matching
    when the AI service fails.
    
    Args:
        query_text: The natural language query text
        
    Returns:
        A dictionary with the generated SQL and other necessary fields, or None if no match
    """
    query_lower = query_text.lower()
    
    # Parse the query to detect intent
    response = {
        "explanation": "Generated based on keyword analysis of your query.",
        "chart_type": "bar",
        "suggested_queries": [
            "What are the top selling products?",
            "Show me monthly sales trends",
            "Which customers have the highest lifetime value?"
        ],
        "query_type": "general"
    }
    
    # Match for product category
    if "category" in query_lower and ("product" in query_lower or "products" in query_lower):
        if "sales" in query_lower or "revenue" in query_lower or "amount" in query_lower or "total" in query_lower:
            response["sql"] = """
            SELECT p.category, SUM(s.total_amount) as total_revenue
            FROM sales s
            JOIN product p ON s.product_id = p.id
            GROUP BY p.category
            ORDER BY total_revenue DESC;
            """
            response["explanation"] = "This query calculates the total revenue by product category, sorted from highest to lowest."
            response["chart_type"] = "bar"
            response["query_type"] = "comparison"
        else:
            response["sql"] = """
            SELECT p.category, COUNT(*) as product_count
            FROM product p
            GROUP BY p.category
            ORDER BY product_count DESC;
            """
            response["explanation"] = "This query counts the number of products in each category."
            response["chart_type"] = "pie"
            response["query_type"] = "distribution"
    
    # Match for top products
    elif "top" in query_lower and "product" in query_lower:
        limit = 5  # Default
        for num in ["3", "5", "10", "twenty", "thirty"]:
            if num in query_lower:
                limit = int(num) if num.isdigit() else 20 if num == "twenty" else 30
                break
                
        response["sql"] = f"""
        SELECT p.name, SUM(s.total_amount) as total_revenue
        FROM sales s
        JOIN product p ON s.product_id = p.id
        GROUP BY p.name
        ORDER BY total_revenue DESC
        LIMIT {limit};
        """
        response["explanation"] = f"This query shows the top {limit} products by total revenue."
        response["chart_type"] = "bar"
        response["query_type"] = "comparison"
    
    # Match for monthly trends
    elif ("month" in query_lower or "trend" in query_lower) and ("sales" in query_lower or "revenue" in query_lower):
        response["sql"] = """
        SELECT 
            DATE_TRUNC('month', s.date) as month,
            SUM(s.total_amount) as total_revenue
        FROM sales s
        GROUP BY month
        ORDER BY month;
        """
        response["explanation"] = "This query shows the monthly revenue trend over time."
        response["chart_type"] = "line"
        response["query_type"] = "time_series"
    
    # Match for customer segments
    elif "customer" in query_lower and "segment" in query_lower:
        response["sql"] = """
        SELECT 
            c.segment,
            SUM(s.total_amount) as total_revenue
        FROM sales s
        JOIN customer c ON s.customer_id = c.id
        GROUP BY c.segment
        ORDER BY total_revenue DESC;
        """
        response["explanation"] = "This query shows the total revenue by customer segment."
        response["chart_type"] = "pie"
        response["query_type"] = "distribution"
    
    # Default query if no pattern matches
    else:
        response["sql"] = """
        SELECT 
            p.name as product_name,
            SUM(s.quantity) as total_quantity,
            SUM(s.total_amount) as total_revenue
        FROM sales s
        JOIN product p ON s.product_id = p.id
        GROUP BY p.name
        ORDER BY total_revenue DESC
        LIMIT 10;
        """
        response["explanation"] = "This query shows the top 10 products by total revenue."
        response["chart_type"] = "bar"
        response["query_type"] = "comparison"
    
    return response

def execute_sql_query(sql_query):
    """
    Execute the SQL query against the database
    
    Args:
        sql_query: The SQL query to execute
    
    Returns:
        Tuple of (results, columns)
    """
    try:
        # Execute the SQL query
        with db.engine.connect() as connection:
            result = connection.execute(text(sql_query))
            # Convert RMKeyView to list of strings for JSON serialization
            columns = list(map(str, result.keys()))
            results = [dict(zip(columns, row)) for row in result.fetchall()]
            
        return results, columns
        
    except Exception as e:
        logger.error(f"Error executing SQL query: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
