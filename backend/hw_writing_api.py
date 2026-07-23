import re
import pymysql
from db_config import DB_CONFIG


# Function to Check Hw1 Status
def check_hw1_status(sid: str) ->dict:
    """Check the status of student homework 1
    
    Args:
        sid (str): Student ID
        
    Returns:
        dict: A dictionary containing status information
        {
            'hasEssay': bool,  
            'state': str | None  
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                SELECT state, eid
                FROM essay_state
                WHERE sid = %s 
                AND source = 'Homework1'
                AND state != 'Cancel';
            """
            cursor.execute(sql, (sid,))
            result = cursor.fetchone()
            
            return {
                'hasEssay': bool(result),
                'state': result['state'] if result else None,
                'eid': result['eid'] if result else None
            }
            
    except Exception as e:
        print(f"Error checking homework status: {str(e)}")
        return {
            'hasEssay': False,
            'state': None,
            'eid': None
        }
        
    finally:
        if connection:
            connection.close()

# Function to Check Homework 2 Status
def check_hw2_status(sid: str) -> dict:
    """Check the status of student homework 2
    
    Args:
        sid (str): Student ID
        
    Returns:
        dict: A dictionary containing status information
        {
            'hasEssay': bool,  
            'state': str | None  
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                SELECT state, eid
                FROM essay_state
                WHERE sid = %s 
                AND source = 'Homework2'
                AND state != 'Cancel';
            """
            cursor.execute(sql, (sid,))
            result = cursor.fetchone()
            
            return {
                'hasEssay': bool(result),
                'state': result['state'] if result else None,
                'eid': result['eid'] if result else None
            }
            
    except Exception as e:
        print(f"Error checking homework status: {str(e)}")
        return {
            'hasEssay': False,
            'state': None,
            'eid': None
        }
        
    finally:
        if connection:
            connection.close()

# Function to Load Homework Data
def load_hw_data(eid: str) -> dict:
    """Load homework related data
    
    Args:
        eid (str): Essay ID
        
    Returns:
        dict: A dictionary containing essay data
        {
            'success': bool,
            'data': {
                'essay': {
                    'topic': str,
                    'content': str
                },
                'images': List[{
                    'iid': str,
                    'modify_keywords': List[str],
                    'modify_description': str
                }],
                'predictions': List[{
                    'pid': str,
                    'pname': str,
                    'pcontent': str,
                    'option': str,
                    'modify_pcontent': str,
                    'record_content': str
                }]
            }
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            essay_sql = """
                SELECT topic, content
                FROM essay_info
                WHERE eid = %s;
            """
            cursor.execute(essay_sql, (eid,))
            essay_data = cursor.fetchone()
            
            if not essay_data:
                return {
                    'success': False,
                    'error': 'Essay not found'
                }
            
            
            images_sql = """
                SELECT iid, modify_keywords, modify_description
                FROM image
                WHERE eid = %s;
            """
            cursor.execute(images_sql, (eid,))
            images_data = cursor.fetchall()
            
            
            predictions_sql = """
                SELECT pid, pname, pcontent, `option`, modify_pcontent, record_content
                FROM prediction
                WHERE eid = %s
                ORDER BY created_at DESC;
            """
            cursor.execute(predictions_sql, (eid,))
            predictions_data = cursor.fetchall()
            
            return {
                'success': True,
                'data': {
                    'essay': {
                        'topic': essay_data['topic'],
                        'content': essay_data['content']
                    },
                    'images': [{
                        'iid': img['iid'],
                        'modify_keywords': img['modify_keywords'].split(',') if img['modify_keywords'] else [],
                        'modify_description': img['modify_description']
                    } for img in images_data],
                    'predictions': [{
                        'pid': pred['pid'],
                        'pname': pred['pname'],
                        'pcontent': pred['pcontent'],
                        'option': pred['option'],
                        'modify_pcontent': pred['modify_pcontent'],
                        'record_content': pred['record_content']
                    } for pred in predictions_data]
                }
            }
            
    except Exception as e:
        print(f"Error loading essay data: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Save Homework Content
def save_hw_content(eid: str, content: str) -> dict:
    """Save essay content
    
    Args:
        eid (str): Essay ID
        content (str): Content to be saved
        
    Returns:
        dict: A dictionary containing the processing result
        {
            'success': bool,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                UPDATE essay_info
                SET content = %s
                WHERE eid = %s;
            """
            cursor.execute(sql, (content, eid))
            connection.commit()
            
            return {
                'success': True
            }
            
    except Exception as e:
        print(f"Error saving essay content: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Submit Homework
def submit_hw(eid: str, content: str) -> dict:
    """Submit homework
    
    Args:
        eid (str): Essay ID
        content (str): Final content
        
    Returns:
        dict: {
            'success': bool,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        try:
            
            sql1 = """
                UPDATE essay_info
                SET content = %s
                WHERE eid = %s
            """
            cursor.execute(sql1, (content, eid))
            
            
            sql2 = """
                UPDATE essay_state
                SET state = 'Completed'
                WHERE eid = %s
            """
            cursor.execute(sql2, (eid,))
            
            
            connection.commit()
            
            return {
                'success': True
            }
            
        except Exception as e:
            
            connection.rollback()
            raise e
            
    except Exception as e:
        print(f"Error submitting homework: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Reset Homework
def reset_hw(eid: str) -> dict:
    """Reset homework status
    
    Args:
        eid (str): Essay ID
        
    Returns:
        dict: {
            'success': bool,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                UPDATE essay_state
                SET state = 'Cancel'
                WHERE eid = %s
            """
            cursor.execute(sql, (eid,))
            connection.commit()
            
            return {
                'success': True
            }
            
    except Exception as e:
        print(f"Error resetting homework: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Get History Essays Content
def get_history_essays_content(sid: str) -> dict:
    """Get the content of the user's past essays
    
    Args:
        sid (str): Student ID
        
    Returns:
        dict: {
            'success': bool,
            'content': str,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                SELECT ei.content
                FROM essay_state es
                JOIN essay_info ei ON es.eid = ei.eid
                WHERE es.sid = %s
            """
            cursor.execute(sql, (sid,))
            results = cursor.fetchall()
            
            if not results:
                return {
                    'success': True,
                    'content': "No previous essays found."
                }
            
            
            processed_contents = []
            for i, row in enumerate(results, 1):
                
                content = re.sub(r'<[^>]+>', '', row['content'])
                
                content = '\n'.join(line for line in content.splitlines() if line.strip())
                processed_contents.append(f"Essay {i}:\n{content}\n")
            
            
            final_content = '\n'.join(processed_contents)
            
            return {
                'success': True,
                'content': final_content
            }
            
    except Exception as e:
        print(f"Error getting user essays: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Save Prediction Result
def save_prediction_result(eid: str, prediction_data: dict) -> dict:
    """Save prediction result
    
    Args:
        eid (str): Article ID
        prediction_data (dict): Prediction related data, including:
            - pname (str): Prediction ID
            - pcontent (str): Prediction content
            - option (str): Selected option
            - modify_pcontent (str): Modified content
            - record_content (str): Complete record content
            - prompt (str, optional): Prompt used for prediction
            
    Returns:
        dict: {'success': bool,
            'pid': str,
            'message': str,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            if 'prompt' in prediction_data and prediction_data['prompt']:
                sql = """
                    INSERT INTO prediction (
                        eid, pname, pcontent, `option`, modify_pcontent, 
                        record_content, prompt, created_at, check_count, updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, NOW(), 0, NOW()
                    )
                """
                cursor.execute(sql, (
                    eid,
                    prediction_data['pname'],
                    prediction_data['pcontent'],
                    prediction_data['option'],
                    prediction_data.get('modify_pcontent', None),  
                    prediction_data['record_content'],
                    prediction_data['prompt']
                ))
            else:
                
                sql = """
                    INSERT INTO prediction (
                        eid, pname, pcontent, `option`, modify_pcontent, 
                        record_content, created_at, check_count, updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, NOW(), 0, NOW()
                    )
                """
                cursor.execute(sql, (
                    eid,
                    prediction_data['pname'],
                    prediction_data['pcontent'],
                    prediction_data['option'],
                    prediction_data.get('modify_pcontent', None),  
                    prediction_data['record_content']
                ))

            
            pid = cursor.lastrowid
            
            connection.commit()
            
            return {
                'success': True,
                'pid': str(pid),
                'message': 'Successfully saved the prediction result'
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error saving prediction: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
        
    finally:
        if connection:
            connection.close()

# Function to Update Prediction Check Count
def update_prediction_check_count(pid: str) -> dict:
    """Update the view count of the prediction
    
    Args:
        pid (str): Prediction ID
        
    Returns:
        dict: {'success': bool,
            'error': str (optional)
        }
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                UPDATE prediction
                SET check_count = check_count + 1
                WHERE pid = %s
            """
            cursor.execute(sql, (pid,))
            connection.commit()
            
            return {
                'success': True,
                'message': 'Update view count successfully'
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            'success': False,
            'error': f'Failed to update view count: {str(e)}'
        }
        
    finally:
        if connection:
            connection.close()

            