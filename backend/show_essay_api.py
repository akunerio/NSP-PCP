from typing import Dict, Union
import pymysql
from db_config import DB_CONFIG

# Function to Update Review Count
def update_review_count(eid: str) -> Dict[str, Union[bool, str]]:
    """Update the article's view count

Args:
    eid (str): Article ID
    
Returns:
    Dict[str, Union[bool, str]]: A dictionary containing the operation result
        - success (bool): Whether the operation was successful
        - message (str): Success message
        - error (str): Error message (only present in case of failure)"""
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                UPDATE essay_info 
                SET review_count = review_count + 1 
                WHERE eid = %s
            """
            cursor.execute(sql, (eid,))
            connection.commit()
            
            return {
                "success": True,
                "message": "Update reading count successful"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "error": f"Failed to update read count: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()