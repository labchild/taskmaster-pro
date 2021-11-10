var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  // debugger;
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// load tasks from storage (runs on page load)
var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// audit task due date for visual representation
var auditTask = function(taskEl) {
  // get date from task el
  var date = $(taskEl).find("span").text().trim();
  // convert to moment obj at 5pm
  var time = moment(date, "L").set("hour", 17);
 
  // remove old classes from task el
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is after time
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// EDITING TASKS
// handle task description  edit
$(".list-group").on("click", "p", function () {
  var text = $(this)
    .text()
    .trim();

  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// handle click away from textarea, save edited task description
$(".list-group").on("blur", "textarea", function () {
  // get textarea's current value
  var text = $(this).val().trim();
  // get parnet ul's id
  // closest ancestor with .list-group, get id, replace "list-" with "" and return remaining string to status
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  // get task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // assign user input as new value for text property in object that is task
  // that object lives in the array that is value for property (status category) of object "tasks"
  tasks[status][index].text = text;
  saveTasks();

  // recreate p el
  var taskP = $("<p>").addClass("m-1").text(text);
  // replace text area with p
  $(this).replaceWith(taskP);
});

// handle edit due date click
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this).text().trim();

  // create new input el
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out els
  $(this).replaceWith(dateInput);

  // enable jQuery UI datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // when calendar is closed, force change on dateInput (it will trigger change listener)
      $(this).trigger("change");
    }
  });

  // focus on new el, auto show datepicker
  dateInput.trigger("focus");
})

// handle click away from date input, value of date changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current (new) text
  var date = $(this).val().trim();
  // get parent container's id
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  // get task's position in the list of other li els
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span el on page with bootstrap classes
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  // replace input wit span el
  $(this).replaceWith(taskSpan);

  // pass task's li el to audit due date for visuals
  auditTask($(taskSpan).closest(".list-group-item"));
});

// drag-and-drop to edit task category
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
  },
  over: function(event) {
    $(this).addClass("dropover-active");
  },
  out: function(event) {
    $(this).removeClass("dropover-active");
  },
  update: function(event) {
    // arr for temp storage of task data
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function () {
      // look at this (the child currently on in the loop), find a p, get the text, and trim it. return as text.
      var text = $(this).find("p").text().trim();
      var date = $(this).find("span").text().trim();

      // add task data to temp arr as obj
      tempArr.push({text: text, date: date});
    });
    
    // trim down list's id to match obj property
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks obj and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// drag an drop to delete individual tasks
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop");
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
});

// use datepicker to set date
$("#modalDueDate").datepicker({
  minDate: 1
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// background audit tasks to auto update
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);

// load tasks for the first time
loadTasks();


