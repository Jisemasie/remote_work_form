export default async function fetchData(url: string, apiMethod: string, data?: object) {
    console.log(`Fetching data for url ${url}`)
    //get the header from the storage
    const fromUser = 'SYSTEM'
    
    let response;
    try{
      if(apiMethod !== 'GET') {  // POST, PATCh
        // Default options are marked with *
        response = await fetch(url, {
        method: apiMethod, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': "Bearer " + AD_AUTH_API_KEY,
          'From': fromUser
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
        });
      } else {
        response = await fetch(url, {  // Get case
        method: apiMethod, // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': "Bearer " + AD_AUTH_API_KEY,
          'From': fromUser
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
      }
      
      if(response.status === 401){
        return {payload: [], error_code: 401};
      };
      
      //console.log("response", response)
      return response.json(); // parses JSON response into native JavaScript objects
    } catch(error){
      console.log('Fetch error : ', error);
      return {'message': 'failure'};
    }
  }