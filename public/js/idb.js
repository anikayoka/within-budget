// create variable to hold db connection
let db;
// establish a connection to IndexedDB
const request = indexedDB.open('within_budget', 1);
// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database 
  const db = event.target.result;
  // create an object store (table) 
  db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online
  if (navigator.onLine) {
    uploadEntry();
  }
};

request.onerror = function (event) {
  // log error here
  console.log("OH OH! " + event.target.errorCode);
};

// This function will be executed if we attempt to submit budget item and there's no internet connection
function saveRecord(record) {
  const transaction = db.transaction(['new_entry'], 'readwrite');
  const objectBudgetStore = transaction.objectStore('new_entry');

  // add record to your store
  objectBudgetStore.add(record);
}

function uploadEntry() {
  const transaction = db.transaction(["new_entry"], "readwrite");
  const objectBudgetStore = transaction.objectStore("new_entry");
  const getAll = objectBudgetStore.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // delete records if successful
          const transaction = db.transaction(["new_entry"], "readwrite");
          const objectBudgetStore = transaction.objectStore("new_entry");
          objectBudgetStore.clear();

          alert('All saved entries submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
};
// listen for app coming back online
window.addEventListener("online", uploadEntry);