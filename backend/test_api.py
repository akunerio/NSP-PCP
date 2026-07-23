from typing import Dict, Union
import pymysql
from db_config import DB_CONFIG

# Function to Check Pretest Status
def check_pretest_status(sid: str) -> bool:
    """Check if the student has completed the pre-test

Args:
    sid (str): Student ID
    
Returns:
    bool: True indicates that the pre-test has not been completed and the student can enter the test, False indicates that the pre-test has been completed"""
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                SELECT COUNT(*) AS count
                FROM essay_state
                WHERE sid = %s
                  AND source = 'Pre-test'
                  AND state = 'Completed'
            """
            cursor.execute(sql, (sid,))
            result = cursor.fetchone()
            
            
            
            return result['count'] == 0
            
    except Exception as e:
        print(f"An error occurred while checking the pretest status: {str(e)}")
        return False
        
    finally:
        if connection:
            connection.close()

# Function to Initialize Pretest Essay
def initialize_pretest_essay(sid: str) -> dict:
    """Initialize pretest essay"""
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            sql1 = """
                INSERT INTO essay_info (topic, content, start_time)
                VALUES ('How To Make Kimchi', '', NOW())
            """
            cursor.execute(sql1)
            
            
            eid = cursor.lastrowid
            
            
            sql2 = """
                INSERT INTO essay_state (sid, eid, source, state)
                VALUES (%s, %s, 'Pre-test', 'Editing')
            """
            cursor.execute(sql2, (sid, eid))
            
            connection.commit()
            return {
                "success": True,
                "eid": eid,
                "message": "Essay initialized successfully"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "message": f"Failed to initialize essay: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()

# Function to Update Pretest Essay Content
def update_pretest_essay_content(eid: str, content: str) -> dict:
    """Update essay content and status"""
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
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
                "success": True,
                "message": "Essay updated successfully"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "message": f"Failed to update essay: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()

# Function to Check Posttest Status
def check_posttest_status(sid: str) -> bool:
    """
    Check if the student has completed the posttest
    
    Args:
        sid (str): Student ID
        
    Returns:
        bool: True indicates the posttest has not been completed and the student can take the test, False indicates the posttest has been completed
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            sql = """
                SELECT COUNT(*) AS count
                FROM essay_state
                WHERE sid = %s
                  AND source ='Post-test'
                  AND state = 'Completed'
            """
            cursor.execute(sql, (sid,))
            result = cursor.fetchone()
            
            
            
            return result['count'] == 0
            
    except Exception as e:
        print(f"An error occurred while checking the posttest status: {str(e)}")
        return False
        
    finally:
        if connection:
            connection.close()

# Function to Initialize Posttest Essay
def initialize_posttest_essay(sid: str) -> dict:
    """Initialize posttest essay"""
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            sql1 = """
                INSERT INTO essay_info (topic, content, start_time)
                VALUES ('Introducing Lebaran in Indonesia', '', NOW())
            """
            cursor.execute(sql1)
            
            
            eid = cursor.lastrowid
            
            
            sql2 = """
                INSERT INTO essay_state (sid, eid, source, state)
                VALUES (%s, %s, 'Post-test', 'Editing')
            """
            cursor.execute(sql2, (sid, eid))
            
            connection.commit()
            return {
                "success": True,
                "eid": eid,
                "message": "Essay initialized successfully"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "message": f"Failed to initialize essay: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()


