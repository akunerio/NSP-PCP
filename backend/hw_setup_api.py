import pymysql
import os
import json
import base64
from datetime import datetime
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Dict
from api_config import GPT_API_KEY
from db_config import DB_CONFIG

client = OpenAI(api_key=GPT_API_KEY)


class ImageAnalysis(BaseModel):
    keywords: List[str]  
    description: str     

# Function to Analyze Image
def analyze_image(image_base64: str) -> dict:
    """Use gpt-4o-mini to analyze image content and provide keywords and descriptions for EFL writing needs."""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """As an EFL writing assistant, please analyze this image and provide:

1. Keywords (5-8 items):
- Important nouns (objects, people, places)
- Action verbs (movements, activities)
- Descriptive adjectives (colors, sizes, emotions)

2. Description (2-3 sentences):
- Use the identified keywords
- Focus on clear and simple sentence structures
- Describe the main elements and their relationships

Format your response as:
Keywords:
[list your keywords]

Description:
[your description]

Response restrictions: No special characters allowed. Include only keywords and descriptions without additional content."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        
        try:
            
            keywords_section = content.split("Keywords:")[1].split("Description:")[0]
            description_section = content.split("Description:")[1]
            
            
            keywords = [
                k.strip().strip('- ') 
                for k in keywords_section.strip().split('\n') 
                if k.strip() and k.strip() != '-']
            
            
            description = description_section.strip()
            
            
            analysis = ImageAnalysis(
                keywords=keywords,
                description=description
            )
            
            return {
                "success": True,
                "data": analysis.dict()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Failed to parse AI response format"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
# Function to Initialize Homework1 Essay
def initialize_homework1_essay(sid: str, title: str) -> Dict[str, any]:
    """
    Initialize homework essay
    
    Args:
        sid (str): Student ID
        title (str): Essay topic
        
    Returns:
        Dict[str, any]: Dictionary containing the processing result
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            sql1 = """
                INSERT INTO essay_info (topic, content, start_time)
                VALUES (%s,'', NOW())
            """
            cursor.execute(sql1, (title,))
            
            
            eid = cursor.lastrowid
            
            
            sql2 = """
                INSERT INTO essay_state (sid, eid, source, state)
                VALUES (%s, %s, 'Homework1', 'Editing')
            """
            cursor.execute(sql2, (sid, eid))
            
            connection.commit()
            return {
                "success": True,
                "eid": eid,
                "message": "Homework essay initialized successfully"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "error": f"Failed to initialize homework essay: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()

# Function to Initialize Homework2 Essay
def initialize_homework2_essay(sid: str, title: str) -> Dict[str, any]:
    """
    Initialize homework essay
    
    Args:
        sid (str): Student ID
        title (str): Essay topic
        
    Returns:
        Dict[str, any]: Dictionary containing the result of the operation
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            
            sql1 = """
                INSERT INTO essay_info (topic, content, start_time)
                VALUES (%s,'', NOW())
            """
            cursor.execute(sql1, (title,))
            
            
            eid = cursor.lastrowid
            
            
            sql2 = """
                INSERT INTO essay_state (sid, eid, source, state)
                VALUES (%s, %s, 'Homework2', 'Editing')
            """
            cursor.execute(sql2, (sid, eid))
            
            connection.commit()
            return {
                "success": True,
                "eid": eid,
                "message": "Homework essay initialized successfully"
            }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            "success": False,
            "error": f"Failed to initialize homework essay: {str(e)}"
        }
        
    finally:
        if connection:
            connection.close()

# Function to Save Hw Images
def save_hw_images(eid: str, images: List[dict]) -> dict:
    """
    Save homework image information
    
    Args:
        eid (str): Article ID
        images (List[dict]): List of image information, each dict contains:
            - file_data: base64 image data
            - keywords: List of keywords analyzed by the API
            - description: Description text analyzed by the API
            - modify_keywords: List of keywords modified by the user
            - modify_description: Description text modified by the user
            
    Returns:
        dict: Dictionary containing the processing result
    """
    connection = None
    try:
        connection = pymysql.connect(**DB_CONFIG)
        
        def clean_text(text: str) -> str:
            """Clean text by removing extra spaces, new lines, and special characters"""
            return text.strip().replace('\n', '').replace('\r', '').strip('"[]')

        def clean_keywords(keywords: List[str]) -> str:
            """Clean the keyword list and convert it to a string"""
            cleaned = [clean_text(kw) for kw in keywords if clean_text(kw)]
            return','.join(cleaned)  
        
        results = []
        
        img_dir = os.path.join('static', 'assets', 'img')
        os.makedirs(img_dir, exist_ok=True)
        
        for img in images:
            with connection.cursor() as cursor:
                
                cleaned_data = {
                    'keywords': clean_keywords(img['keywords']),
                    'modify_keywords': clean_keywords(img['modify_keywords']),
                    'description': clean_text(img['description']),
                    'modify_description': clean_text(img['modify_description'])
                }
                
                
                sql = """
                    INSERT INTO image (
                        eid, 
                        keywords, 
                        modify_keywords, 
                        description, 
                        modify_description, 
                        updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """
                cursor.execute(sql, (
                    eid,
                    cleaned_data['keywords'],  
                    cleaned_data['modify_keywords'],
                    cleaned_data['description'],
                    cleaned_data['modify_description']
                ))
                
                
                iid = cursor.lastrowid
                
                
                try:
                    
                    img_data = img['file_data']
                    if ',' in img_data:  
                        img_data = img_data.split(',')[1]
                    
                    
                    img_binary = base64.b64decode(img_data)
                    
                    
                    img_header = img_binary[:10]
                    if img_header.startswith(b'\xFF\xD8'):
                        ext = '.jpg'
                    elif img_header.startswith(b'\x89PNG\r\n'):
                        ext = '.png'
                    elif img_header.startswith(b'RIFF') and b'WEBP' in img_header:
                        ext = '.webp'
                    else:
                        ext = '.jpg'  
                    
                    
                    img_path = os.path.join(img_dir, f"{iid}{ext}")
                    with open(img_path, 'wb') as f:
                        f.write(img_binary)
                    
                except Exception as e:
                    print(f"Error saving image file: {str(e)}")
                    raise
                
                results.append({
                    'iid': iid,
                    'status': 'success'
                })
        
        connection.commit()
        return {
            'success': True,
            'data': results
        }
            
    except Exception as e:
        if connection:
            connection.rollback()
        return {
            'success': False,
            'error': f'Failed to save images: {str(e)}'
        }
        
    finally:
        if connection:
            connection.close()