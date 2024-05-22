from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from sap_ber_client import ber_api_client
from time import sleep

app = Flask(__name__)
cors = CORS(app, origins="*")
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/health')
@cross_origin()
def health():
    return jsonify("OK")

def addAuth(data):

    try:
        url = data['url']
        uaa_clientid = data['uaa']['clientid']
        uaa_clientsecret = data['uaa']['clientsecret']
        uaa_url = data['uaa']['url']
    
        return ber_api_client.BER_API_Client(url, uaa_clientid, uaa_clientsecret, uaa_url)
    except:
        return None

@app.route('/models', methods=['POST'])
@cross_origin()
def getModels():
    ber_service = addAuth(request.get_json())

    if ber_service is None:
        return "No valid credentials provided", 400
    
    models = ber_service.get_trained_models()
    result = models.json()['data']['sapModels']['models']
    return jsonify({"items" : result})

@app.route('/inference', methods=['POST'])
@cross_origin()
def inference():
    req_data = request.get_json()

    ber_service = addAuth(req_data['auth'])
    
    model_version = 1
    model_name = req_data['model']
    text = req_data['text']
    
    if ber_service is None:
        return "No valid credentials provided", 400
    

    inference_job = ber_service.post_inference_job(text,model_name, model_version)
    inference_jobid = inference_job.json()['data']['id']
    
    inference_job_result = ber_service.get_inference_job(inference_jobid)
    while inference_job_result.json()['data']['status'] == 'PENDING':
        inference_job_result = ber_service.get_inference_job(inference_jobid)
        sleep(1)
    response = inference_job_result.json()
    
    data = response['data']['result'][0]
    result = []
    for key in data.keys():
        if len(data[key]) == 0:
            merged = {"name": key, "value": '', "confidence": 0}
        else:
            merged = {"name": key} | data[key][0]
        result.append(merged)

    return jsonify({"items" : result})
