# uvicorn main:app --host 0.0.0.0 --port 8000
import os
import sys
import uvicorn
import base64
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
# python function
from login_api import verify_login
from index_api import get_user_essays
from test_api import check_pretest_status, initialize_pretest_essay, update_pretest_essay_content, check_posttest_status, initialize_posttest_essay
from hw_writing_api import check_hw1_status, check_hw2_status, load_hw_data, save_hw_content, reset_hw, submit_hw, get_history_essays_content, save_prediction_result, update_prediction_check_count
from hw_setup_api import analyze_image, initialize_homework1_essay, initialize_homework2_essay, save_hw_images
from predict_api import get_predict_sentence
from show_essay_api import update_review_count



app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")


app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")), name="static")


templates = Jinja2Templates(directory=os.path.join(FRONTEND_DIR, "templates"))


@app.get("/", response_class=HTMLResponse)
# Function to Index
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
# Function to Login
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/404", response_class=HTMLResponse)
# Function to Error
async def error(request: Request):
    return templates.TemplateResponse("404.html", {"request": request})

@app.get("/show_essay", response_class=HTMLResponse)
# Function to Show Essay
async def show_essay(request: Request):
    return templates.TemplateResponse("show_essay.html", {"request": request})

@app.get("/hw1_writing_setup", response_class=HTMLResponse)
# Function to Hw1 Writing Setup
async def hw1_writing_setup(request: Request):
    return templates.TemplateResponse("hw1_writing_setup.html", {"request": request})

@app.get("/hw1_writing", response_class=HTMLResponse)
# Function to Hw1 Writing
async def hw1_writing(request: Request):
    return templates.TemplateResponse("hw1_writing.html", {"request": request})

@app.get("/hw2_writing_setup", response_class=HTMLResponse)
# Function to Hw2 Writing Setup
async def hw2_writing_setup(request: Request):
    return templates.TemplateResponse("hw2_writing_setup.html", {"request": request})

@app.get("/hw2_writing", response_class=HTMLResponse)
# Function to Hw2 Writing
async def hw2_writing(request: Request):
    return templates.TemplateResponse("hw2_writing.html", {"request": request})

@app.get("/test1_writing", response_class=HTMLResponse)
# Function to Test1 Writing
async def test1_writing(request: Request):
    return templates.TemplateResponse("test1_writing.html", {"request": request})

@app.get("/test2_writing", response_class=HTMLResponse)
# Function to Test2 Writing
async def test2_writing(request: Request):
    return templates.TemplateResponse("test2_writing.html", {"request": request})

@app.get("/hw_writing_setup_instruct", response_class=HTMLResponse)
# Function to Hw Writing Setup Instruct
async def hw_writing_setup_instruct(request: Request):
    return templates.TemplateResponse("hw_writing_setup_instruct.html", {"request": request})

@app.get("/hw_writing_instruct", response_class=HTMLResponse)
# Function to Hw Writing Instruct
async def hw_writing_instruct(request: Request):
    return templates.TemplateResponse("hw_writing_instruct.html", {"request": request})





class LoginData(BaseModel):
    account: str
    password: str

@app.post("/verify_login")
# Function to Api Login
async def api_login(login_data: LoginData):
    
    student_result = verify_login(login_data.account, login_data.password)
    if student_result.get("success"):
        return JSONResponse(content={
            "success": True,
            "data": {
                "sid": student_result.get("data", {}).get("sid"),
                "username": student_result.get("data", {}).get("username")
            }
        })
    
    return JSONResponse(content={
        "success": False,
        "message": "Incorrect account or password"
    })


@app.get("/get_user_essays/{sid}")
# Function to Api Get User Essays
async def api_get_user_essays(sid: str):
    result = get_user_essays(sid)
    return JSONResponse(content=result)


@app.get("/check_pretest_status/{sid}")
# Function to Api Check Pretest Status
async def api_check_pretest_status(sid: str):
    return JSONResponse(content={"canTakeTest": check_pretest_status(sid)})


@app.get("/check_posttest_status/{sid}")
# Function to Api Check Posttest Status
async def api_check_posttest_status(sid: str):
    return JSONResponse(content={"canTakeTest": check_posttest_status(sid)})


@app.post("/initialize_pretest/{sid}")
# Function to Api Initialize Pretest
async def api_initialize_pretest(sid: str):
    result = initialize_pretest_essay(sid)
    return JSONResponse(content=result)


@app.post("/initialize_posttest/{sid}")
# Function to Api Initialize Posttest
async def api_initialize_posttest(sid: str):
    result = initialize_posttest_essay(sid)
    return JSONResponse(content=result)


class EssayContent(BaseModel):
    content: str

@app.post("/update_pretest_essay/{eid}")
# Function to Api Update Pretest Essay
async def api_update_pretest_essay(eid: str, essay_content: EssayContent):
    result = update_pretest_essay_content(eid, essay_content.content)
    return JSONResponse(content=result)


@app.get("/check_hw1_status/{sid}")
# Function to Api Check Hw1 Status
async def api_check_hw1_status(sid: str):
    result = check_hw1_status(sid)
    return JSONResponse(content=result)


@app.get("/check_hw2_status/{sid}")
# Function to Api Check Hw2 Status
async def api_check_hw2_status(sid: str):
    result = check_hw2_status(sid)
    return JSONResponse(content=result)


@app.post("/analyze_image/")
# Function to Api Analyze Image
async def api_analyze_image(file: UploadFile = File(...)):
    try:
        
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        
        result = analyze_image(image_base64)
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            content={
                "success": False,
                "error": str(e)
            },
            status_code=500
        )


class ImageInfo(BaseModel):
    file_data: str
    keywords: List[str]
    description: str
    modify_keywords: List[str]
    modify_description: str

class HomeworkSetup(BaseModel):
    sid: str
    title: str
    images: List[ImageInfo]

@app.post("/initialize_homework1")
# Function to Api Initialize Homework1
async def api_initialize_homework1(setup_data: HomeworkSetup):
    
    essay_result = initialize_homework1_essay(setup_data.sid, setup_data.title)
    
    if not essay_result['success']:
        return JSONResponse(content=essay_result)
    
    
    images_result = save_hw_images(
        essay_result['eid'],
        [img.dict() for img in setup_data.images]
    )
    
    if not images_result['success']:
        return JSONResponse(content=images_result)
    
    return JSONResponse(content={
        'success': True,
        'eid': essay_result['eid']
    })


@app.post("/initialize_homework2")
# Function to Api Initialize Homework2
async def api_initialize_homework2(setup_data: HomeworkSetup):
    
    essay_result = initialize_homework2_essay(setup_data.sid, setup_data.title)
    
    if not essay_result['success']:
        return JSONResponse(content=essay_result)
    
    
    images_result = save_hw_images(
        essay_result['eid'],
        [img.dict() for img in setup_data.images]
    )
    
    if not images_result['success']:
        return JSONResponse(content=images_result)
    
    return JSONResponse(content={
        'success': True,
        'eid': essay_result['eid']
    })


@app.get("/load_hw_data/{eid}")
# Function to Api Load Hw Data
async def api_load_hw_data(eid: str):
    result = load_hw_data(eid)
    return JSONResponse(content=result)


class EssayContent(BaseModel):
    content: str

@app.post("/save_hw_content/{eid}")
# Function to Api Save Hw Content
async def api_save_hw_content(eid: str, essay_content: EssayContent):
    result = save_hw_content(eid, essay_content.content)
    return JSONResponse(content=result)


@app.post("/reset_hw/{eid}")
# Function to Api Reset Hw
async def api_reset_hw(eid: str):
    result = reset_hw(eid)
    return JSONResponse(content=result)


@app.post("/submit_hw/{eid}")
# Function to Api Submit Hw
async def api_submit_hw(eid: str, essay_content: EssayContent):
    result = submit_hw(eid, essay_content.content)
    return JSONResponse(content=result)


@app.get("/get_history_essays_content/{sid}")
# Function to Api Get History Essays Content
async def api_get_history_essays_content(sid: str):
    result = get_history_essays_content(sid)
    return JSONResponse(content=result)


class PredictRequest(BaseModel):
    current_essay_content: str
    history_essay_content: str
    images_info: List[dict]
    title: str


@app.post("/predict_sentence")
# Function to Api Predict Sentence
async def api_predict_sentence(predict_request: PredictRequest):
    try:
        result, user_prompt = await get_predict_sentence(
            predict_request.current_essay_content,
            predict_request.history_essay_content,
            predict_request.images_info,
            predict_request.title
        )
        
        return JSONResponse(content={
            "success": True,
            "predict_sentence": result,
            "predict_prompt": user_prompt
        })
    except Exception as e:
        return JSONResponse(
            content={
                "success": False,
                "error": str(e)
            },
            status_code=500
        )


class PredictionData(BaseModel):
    pname: str
    pcontent: str
    option: str
    modify_pcontent: str | None = None
    record_content: str
    prompt: str | None = None
    
@app.post("/save_prediction/{eid}")
# Function to Api Save Prediction
async def api_save_prediction(eid: str, prediction_data: PredictionData):
    result = save_prediction_result(eid, prediction_data.dict())
    return JSONResponse(content=result)


@app.post("/update_review_count/{eid}")
# Function to Api Update Review Count
async def api_update_review_count(eid: str):
    result = update_review_count(eid)
    return JSONResponse(content=result)


@app.post("/update_prediction_count/{pid}")
# Function to Api Update Prediction Count
async def api_update_prediction_count(pid: str):
    result = update_prediction_check_count(pid)
    return JSONResponse(content=result)




if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, timeout_keep_alive=120)
