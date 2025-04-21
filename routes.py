import json
import logging
from flask import request, jsonify, render_template
from app import app, db
from models import QueryHistory
from ai_agent import process_voice_query, execute_sql_query
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/api/voice-query', methods=['POST'])
def handle_voice_query():
    """Process a voice query transcription and generate SQL using AI"""
    data = request.json
    
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400
    
    voice_query = data['query']
    # Get the language if provided, default to English
    language = data.get('language', 'en-US')
    
    # Extract the main language code (e.g., 'en' from 'en-US')
    main_language = language.split('-')[0] if '-' in language else language
    
    logger.info(f"Received voice query: {voice_query} (language: {language})")
    
    try:
        # Process the query with Gemini AI
        result = process_voice_query(voice_query, language_code=main_language)
        
        if not result:
            return jsonify({'error': 'Failed to process query with AI'}), 500
        
        # Save query to history
        query_history = QueryHistory(
            voice_query=voice_query,
            generated_sql=result['sql'],
            explanation=result['explanation']
        )
        db.session.add(query_history)
        db.session.commit()
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error processing voice query: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/run-sql', methods=['POST'])
def run_sql():
    """Execute a generated SQL query against the database"""
    data = request.json
    
    if not data or 'sql' not in data:
        return jsonify({'error': 'No SQL query provided'}), 400
    
    sql_query = data['sql']
    logger.info(f"Executing SQL query: {sql_query}")
    
    try:
        # Execute the SQL query
        results, columns = execute_sql_query(sql_query)
        
        # Prepare response - ensure columns are JSON serializable
        response = {
            'columns': list(map(str, columns)),
            'data': results,
            'rowCount': len(results)
        }
        
        # Debug logging
        logger.debug(f"SQL results: {len(results)} rows with columns {columns}")
        
        return jsonify(response)
    
    except SQLAlchemyError as e:
        logger.error(f"SQL error: {str(e)}")
        return jsonify({'error': f'SQL error: {str(e)}'}), 400
    
    except Exception as e:
        logger.error(f"Error executing SQL query: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/query-history', methods=['GET'])
def get_query_history():
    """Get the history of previous queries"""
    try:
        history = QueryHistory.query.order_by(QueryHistory.created_at.desc()).limit(10).all()
        
        history_list = [{
            'id': item.id,
            'query': item.voice_query,
            'sql': item.generated_sql,
            'explanation': item.explanation,
            'created_at': item.created_at.isoformat()
        } for item in history]
        
        return jsonify(history_list)
    
    except Exception as e:
        logger.error(f"Error retrieving query history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500
