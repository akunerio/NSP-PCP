import pymysql
from db_config import DB_CONFIG
from typing import Dict, Union, List
import json
import os
from pathlib import Path

# Function to Get Image Path
def get_image_path(iid):
    """Check and return the correct image path"""
    base_path = f"/static/assets/img/{iid}"
    
    extensions = ['.jpg', '.JPG', '.png', '.PNG', '.webp', '.WEBP']
    for ext in extensions:
        if os.path.exists(f"static/assets/img/{iid}{ext}"):
            return f"{base_path}{ext}"
    return "/static/assets/img/default.jpg"

# Function to Get User Essays
def get_user_essays(sid: str) -> Dict[str, Union[bool, str, List[dict]]]:
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        
        
        sid = int(sid)        
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    es.eid,
                    es.source,
                    ei.topic,
                    ei.content,
                    ei.updated_at,
                    CONCAT('[', GROUP_CONCAT(img.iid ORDER BY img.iid SEPARATOR ','), ']') AS iid_list
                FROM 
                    essay_state es
                JOIN 
                    essay_info ei ON es.eid = ei.eid
                LEFT JOIN 
                    image img ON es.eid = img.eid
                WHERE 
                    es.sid = %s
                    AND es.state = 'Completed'
                GROUP BY 
                    es.eid, es.source, ei.topic, ei.content, ei.updated_at
                ORDER BY 
                    ei.eid;
            """
            cursor.execute(sql, (sid,))
            raw_essays = cursor.fetchall()
            
            
            essays = []
            for essay in raw_essays:
                
                iid_list_str = essay['iid_list']
                images = []
                if iid_list_str and iid_list_str != '[]':
                    
                    iid_list = json.loads(essay['iid_list'])
                    
                    images = [get_image_path(iid) for iid in iid_list]

                formatted_essay = {
                    'eid': essay['eid'],
                    'source': essay['source'],
                    'topic': essay['topic'],
                    'content': essay['content'],
                    'date': essay['updated_at'].strftime('%Y-%m-%d'),
                    'images': images  
                }
                essays.append(formatted_essay)
            return {
                "success": True,
                "message": "Essays retrieved successfully",
                "data": essays
            }
                
    except ValueError as ve:
        print(f"sid conversion error: {str(ve)}")
        return {
            "success": False,
            "message": "Invalid sid format"
        }
    except Exception as e:
        print(f"Detailed error: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to retrieve essays: {str(e)}"
        }
    
    finally:
        if connection:
            connection.close()