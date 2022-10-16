const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

// dialog flow
const projectId = process.env.PROJECT_ID || 'daraleiman-basn' ;
const sessionId = uuid.v4();

const sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.PROJECT_KEY_FILE || 'daraleiman-basn-949072373450.json' 
});
 
async function Chatting(inputText,phoneNumber) {
const request = {
    session: sessionClient.projectAgentSessionPath(
        projectId,
        phoneNumber
    ),
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: inputText,
        // The language used by the client (en-US)
        languageCode: 'id-ID',
      },
    },
  };
 
  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;
  if (result.intent) {
    return result;
  } else {
    return "no intent";
  }
}