import pymysql
from db_config import DB_CONFIG
from typing import Dict, Union

# Function to Verify Login
def verify_login(account: str, password: str) -> Dict[str, Union[bool, str, dict]]:
    """Validate user login information

Args:
    account: User account
    password: User password
    
Returns:
    Dict: A dictionary containing the login result, formatted as follows:
    {"success": bool,
            "message": str,
            "data": {
                "sid": str,
                "username": str
            }
        }
    """
    try:
        
        connection = pymysql.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            db=DB_CONFIG['db'],
            charset=DB_CONFIG['charset'],
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            
            sql = """
                SELECT sid, name
                FROM students 
                WHERE account = %s AND password = %s
            """
            cursor.execute(sql, (account, password))
            user = cursor.fetchone()
            
            if user:
                
                return {
                    "success": True,
                    "message": "Login successful",
                    "data": {
                        "sid": str(user['sid']),
                        "username": user['name']
                    }
                }
            else:
                
                return {
                    "success": False,
                    "message": "Invalid account or password"
                }
                
    except Exception as e:
        print(f"Login error: {str(e)}")
        return {
            "success": False,
            "message": "Server error occurred"
        }
    
    finally:
        if 'connection' in locals():
            connection.close()
