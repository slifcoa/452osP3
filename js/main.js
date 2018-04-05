
//Global Variables, used throughout the program
var commandCounter = 0;
const pageSize = 512;
var memArray = [];

//Generate's array for physical memory frames
for (var i = 0; i < 8; i++){
    var physicalMem = {
        frameId: i,
        available: true,
        content: "free",
        pageProcessID: null
    };
    memArray.push(physicalMem);

    document.getElementById("frame".concat(i.toString())).innerHTML = memArray[i].content;

}

//Reads local files and parses them line by line, then generates
//a the command table accordingly
function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;

                //creates array for commands
                var commands = allText.split('\n');

                //
                createCommandsTable(commands);

            }
        }
    }
    rawFile.send(null);
}

//Prompt's the user to choose between the three files and reads that file
const filename = prompt("Please enter the command file you would like to run (a,b,or c)", "a");
readTextFile("data/input3" + filename + ".txt");


//Generates the commands table
function createCommandsTable(commands){

    //Get the commands table by it's ID
    var table = document.getElementById("commandsTable");

    //Loop through all commands and insert them into a row
    for(var i = 0; i < commands.length; i++) {

        var row = table.insertRow(i);
        row.setAttribute('id', "commandsRow" + i);
        var data = row.insertCell(0);
        data.innerHTML = commands[i];
    }
}

//highlight's the next row and un-highlights the previous
//one when necessary
function hitNext(rowIndex){

    var row = document.getElementById("commandsRow" + rowIndex);

    row.style.backgroundColor = 'green';

    //un-highlight previous command if this wasn't initial command
    if(rowIndex > 0) {
        var unhighlight = document.getElementById("commandsRow" + (rowIndex - 1));
        unhighlight.style.backgroundColor = 'initial';
    }
    //change button label from 'start' to 'next'
    else
    {
        document.getElementById("startButton").innerHTML="Next";
    }

    //perform actual command operations
    performCommand(rowIndex);

    //increment global command counter
    commandCounter++;

}

//Called when user clicks close button when displaying a page table
//show's and hide's div blocks accordingly
function hitClose(){

    var hideContent = document.getElementById("app");
    hideContent.style.display = "block";

    var showContent = document.getElementById("processPageTableDIV");
    showContent.style.display = "none";

}

//Parses the command and properly calls the event function
function performCommand(commandNumber){

    //retrieves current row in command list
    var row = document.getElementById("commandsRow" + commandNumber);

    //parses command by whitespace
    var commands = row.innerText.split(' ');

    //if command starts new process & page table
    if(commands.length == 3){
        processArrival(commands);
    }
    //if command halts process
    else if(commands.length == 2){
        processTermination(commands);
    }
    else {
        alert("INVALID COMMAND");
    }
}

//Parses the command and determines amount of pages needed
function processArrival (commands){

    //total text and data pages for process
    var textPages = Math.ceil(commands[1]/pageSize);
    var dataPages = Math.ceil(commands[2]/pageSize);

    //object that holds all pages for process
    var pageTable = {
        processID: commands[0],
        numTPages: textPages,
        numDPages: dataPages,
        totalPages: textPages + dataPages,
        pages:[]
    }

    //Searches through physical frames
    for(var i = 0; i < memArray.length; i++){

        //If the frame is free
        if(memArray[i].available == true){

            //Decrement text pages every time one is inserted to frame
            if(textPages > 0) {
                memArray[i].available = false;

                var textPage = {
                    processID: commands[0],
                    type: "Text",
                    frame: i
                }

                //Update the physical frame's content
                memArray[i].content = "P" + textPage.processID + " " + textPage.type + " " + textPage.frame;
                memArray[i].processID = commands[0];
                textPages--;
                pageTable.pages.push(textPage);

                //Update the HTML content to reflect the changes made
                document.getElementById("frame".concat(i.toString())).innerHTML = memArray[i].content;

                //Decrement data pages every time one is inserted to frame
            } else if(dataPages > 0){
                memArray[i].available = false;

                var dataPage = {
                    processID: commands[0],
                    type: "Data",
                    frame: i
                }

                //Update the physical frame's content
                memArray[i].content = "P" + dataPage.processID + " " + dataPage.type + " " + dataPage.frame;
                memArray[i].processID = commands[0];
                dataPages--;
                pageTable.pages.push(dataPage);

                //Update the HTML content to reflect the changes made
                document.getElementById("frame".concat(i.toString())).innerHTML = memArray[i].content;

            } else {
                break;
            }
        }
    }

    //add button into page tables pane
    var tableRow = document.getElementById("pageTableList");
    var cell = tableRow.insertCell(0);

    //Set attribute and content
    cell.setAttribute('id','process' + commands[0]);
    cell.innerHTML = "Process " + commands[0];

    //Register Click listener on the cell
    cell.onclick = function(){
        generatePageTable(pageTable);
    };
}

//Free's up frames used by the terminated process
function processTermination (commands){

    var processID = commands[0];

    for(var i = 0; i < memArray.length; i++){

        //if frame's in use by the terminated process
        if(memArray[i].available == false && memArray[i].processID == processID){
            memArray[i].available = true;
            memArray[i].content = "free";
            document.getElementById("frame".concat(i.toString())).innerHTML = memArray[i].content;

        }
    }

    //This portion delete's the pageTable cell from the bottom of index.html
    var tableRow = document.getElementById("pageTableList");

    //Get the proper cell to delete
    var cellToDelete = document.getElementById('process' + processID);

    //delete cell -- index is calculated by getting cell's id
    tableRow.deleteCell(cellToDelete.cellIndex);

}

//generates the page table that was clicked on
//Hide's and Shows the proper div blocks
function generatePageTable(pageTable){

    //Gets the html table for page table
    var table = document.getElementById("pageTableProcessBody");

    //Get header to allow dynamic header renaming
    var tableHeader = document.getElementById("processPageTableHeader");
    tableHeader.innerHTML = "Page table for Process " + pageTable.processID;

    //Delete rows from previously viewed page tables
    var tableRowCount = table.rows.length;
    console.log("ROW COUNT " + tableRowCount);
    for (var i = tableRowCount - 1; i >= 0; i--) {
        table.deleteRow(i);
    }

    for(var i = 0; i < pageTable.numTPages; i++){
        var row = table.insertRow(i);

        var textCell = row.insertCell(0);
        textCell.innerHTML = pageTable.pages[i].type;

        var pageCell = row.insertCell(1);
        pageCell.innerHTML = i.toString();

        var frameCell = row.insertCell(2);
        frameCell.innerHTML = pageTable.pages[i].frame;
    }

    for(var j = 0; j < pageTable.numDPages; j++){

        //Append data pages after the text pages
        var row = table.insertRow(pageTable.numTPages + j);

        var textCell = row.insertCell(0);
        textCell.innerHTML = pageTable.pages[pageTable.numTPages + j].type ;

        var pageCell = row.insertCell(1);
        pageCell.innerHTML = (j.toString());

        var frameCell = row.insertCell(2);
        frameCell.innerHTML = pageTable.pages[pageTable.numTPages + j].frame;

    }

    //Show page table and hide everything else
    var hideContent = document.getElementById("app");
    hideContent.style.display = "none";

    var showContent = document.getElementById("processPageTableDIV");
    showContent.style.display = "block";



}



