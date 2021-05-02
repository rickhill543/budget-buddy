// db variable and connection
let db;
const request = indexedDB.open('budget', 1);

// updates database based on version
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

  // when database connection is successful, this saves the db reference to a variable
request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };

  // Function that handles spotty or no internet connection to save information locally
function saveRecord(record) {
    console.log("Data saved to local browser due to spotty internet connection! Will update server upon internet reconnection!");
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    transactionObjectStore.add(record);
  }

    // Function that uploads any pending data upon internet reestablishment
  function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
  
    const getAll = transactionObjectStore.getAll();
  
    getAll.onsuccess = function() {
      if (getAll.result.length > 0) {
        fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(serverResponse => {
            if (serverResponse.message) {
              throw new Error(serverResponse);
            }
  
            const transaction = db.transaction(['new_transaction'], 'readwrite');
            const transactionObjectStore = transaction.objectStore('new_transaction');
            // clear all items stored locally after successful upload
            transactionObjectStore.clear();
          })
          .catch(err => {
            console.log(err);
          });
      }
    };
  }
  
  // listens for app coming back online
  window.addEventListener('online', uploadTransaction);