// Get Calendar Info
var array = msg.payload;

// Variables
let messages = [];
// Fill out array with unit numbers and phone numbers to send do.  The event titles in the calendar would have the unit number
const phone_numbers = {
    "Unit A": ["+15551234567", "+15557654321"],
}

// Function to get tomorrow's date in YYYY-MM-DD format
function getTomorrowDate() {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Extract unit and multiple garbage types from calendar
function getGarbageInfo(array) {
    let unit_number;
    let garbage_types = []; // Array to hold multiple garbage types
    let tomorrowDate = getTomorrowDate(); // Get tomorrow's date

    var arrayLength = array.length;

    for (var i = 0; i < arrayLength; i++) {
        if (array[i].summary && array[i].summary.includes("Unit")) {
            node.log(array[i].summary);
            unit_number = array[i].summary
        } else if (array[i].summary && array[i].summary.includes("Pickup")) {
            // Convert eventStart to Date object and compare with tomorrow's date
            let eventStartDate = new Date(array[i].eventStart);
            let eventStartFormatted = eventStartDate.toISOString().split('T')[0];

            if (eventStartFormatted === tomorrowDate) {
                // Add the garbage type to the array after removing "Pickup - "
                garbage_types.push(array[i].summary.replace(/^Pickup - /, ''));
            }
        }
    }
    // Join multiple garbage types with a comma and space
    let garbage_types_str = garbage_types.join(", ");
    return [unit_number, garbage_types_str];
}

// Generate message to send
function generateMsg(phone_number,garbage_type,unit_number) {

    let from_number;
    let body;
    let data;

    from_number = "+15555555555" // Source Number for SMS Provider
    body = "Reminder " + unit_number + "! " + "company will pickup " + garbage_type.toLowerCase() + " tomorrow."
    data = { 'To': phone_number, 'From': from_number, 'Body': body };

    return data
}
 // Generate List of numbers
function getPhoneNumbers(unit_number) {

    let phone_numbers_result;
    for (let k in phone_numbers) {
        if (k = unit_number) {
            phone_numbers_result = phone_numbers[k] 
        }
    }
    return phone_numbers_result
}

// Delay Function
function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

// Main Code
if (msg.total === 0) {
    msg.payload = "No garbage today";
}
else {
    // Delete Extra Data
    ;['payload', 'topic', '_msgid', 'today', 'tomorrow', 'total', 'htmlTable'].forEach(prop => delete msg[prop])
    
    const [unit_number, garbage_type] = getGarbageInfo(array)

    // Check if garbage types were found
    if (garbage_type === "") {
        msg.payload = "No garbage today";
        node.send(msg);
    } else {
        const phone_numbers = getPhoneNumbers(unit_number)
        for (let p in phone_numbers) {
            messages.push(generateMsg(phone_numbers[p],garbage_type,unit_number))
        }
        let i = 0;
        do {
            msg.payload = messages[i]
            node.send(msg);
            await delay(1000);
            i++;
        } while (i < messages.length);
    }
}
