var selected;
var place;
var dropup = false;
var full_event = [
    {
        id : 1,
        title  : 'event1',
        start  : '2017-10-08',
        end  : '2017-10-08',
        allDay : true,
        place : {lat: -25.363, lng: 131.044}
    },
    {
        id : 2,
        title  : 'event2',
        start  : '2017-10-05',
        end    : '2017-10-11',
        place : {lat: 36.374077, lng: 127.365463}
    },
    {
        id : 3,
        title  : 'event3',
        start  : '2017-10-09T12:30:00',
        end  : '2017-10-09T16:30:00',
        allDay : false // will make the time show,
    }
];

$(document).ready(function() {

    $('#calendar').fullCalendar({
        header: {
            left: 'prev,today,next',
            center: 'title',
            right: 'month,agendaWeek,listDay'
        },
        defaultView: 'agendaWeek',
        events: full_event,
        dayClick: function(date, jsEvent, view) {
            selected && selected.removeClass("selected");
            selected = $(this);
            selected.addClass("selected");
            $('#calendar').fullCalendar('changeView', 'listDay', date);

        }
    });

$(document).on('click','.map-view', function () {
    var id = $(this).data('id');
        full_event.some(function (t) {
            if (t.id == id) {
                place = t.place;
                return true;
            } else {
                return false;
            }
        });

    });

    $('#mapModal').on('shown.bs.modal',function () {
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 17,
            center: place
        });
        var marker = new google.maps.Marker({
            position: place,
            map: map
        });
        $('.loader').hide();
    }).on('hidden.bs.modal', function(){
        $('#map').empty();
        $('.loader').show();
    });
});


function btclick(){
    if(!$('.dropup').hasClass('open')){
        $('.dropup').find('.fa-plus').removeClass('fa-plus').addClass('fa-times');
    }
    else{
        $('.dropup').find('.fa-times').removeClass('fa-times').addClass('fa-plus');
    }
}

$(document).on('click', '#import_schedule', function() {
    $('#import_google').on('shown.bs.modal', function() {
        $('#start_date,#end_date').datetimepicker({
            format: 'YYYY/MM/DD hh:mm',
            useCurrent: true
        });
    });
});

$(document).on('click', '.import_btn', function() {
    var start_picker = $('#start_date').data();
    var end_picker = $('#end_date').data();

    var start_date = start_picker.date ? new Date(start_picker.date) : null;
    var end_date = end_picker.date ? new Date(end_picker.date) : null;

    if (start_date && end_date && start_date.getTime() >= end_date.getTime()) {
        $('.warning_msg').show();
        setTimeout(function() {
            $('.warning_msg').hide();
        }, 2000);
    } else {
        console.log(start_date, end_date);

        var calendarId = '';
        /*
        $.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {}, function(cal_list) {
            if (cal_list && !cal_list.error) {
                cal_list.items.some(function(cal) {
                    if (cal.accessRole == 'owner') {
                        calendarId = cal.id;
                        return true;
                    } else {
                        return false;
                    }
                });
        */
                var options = {};
                if (start_date) {
                    options.timeMin = start_date.toJSON();
                }
                if (end_date) {
                    options.timeMax = end_date.toJSON();
                }

                /*
                $.get('https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events', options, function(result) {
                    if (result && !result.error) {
                        var events = result.items;
                    } else {
                        console.log(result.error.message);
                    }
                */
                    $(this).parents('.modal.in').modal('hide');
            
                    $('#start_date input,#end_date input').val('');
                    start_picker.DateTimePicker.destroy();
                    end_picker.DateTimePicker.destroy();
                //});
            //} else {
            //    console.log(cal_list.error.message);
            //}
        //});
    }
});

function make_random_string(num) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < num; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    return text;
}

$(document).on('click', '.export_btn', function() {
    var id = $(this).data('id');
    var ex_event;
    full_event.some(function (t) {
        if (t.id == id) {
            ex_event = t;
            return true;
        } else {
            return false;
        }
    });

    var calendarId = '';

    /*   
    $.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {}, function(cal_list) {
        if (cal_list && !cal_list.error) {
            cal_list.items.some(function(cal) {
                if (cal.accessRole == 'owner') {
                    calendarId = cal.id;
                    return true;
                } else {
                    return false;
                }
            });

            var options = {
                iCalUID: make_random_string(17) + '@google.com',
                start: {
                    dateTime: new Date(ex_event.start).toJSON()
                },
                end: {
                    dateTime: new Date(ex_event.end).toJSON()
                },
                summary: ex_event.title,
                description: ex_event.description || ''
            };

            $.post('https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events/import', options, function(result) {
                if (result && !result.error) {
                    console.log('Export Success!');
                } else {
                    console.log(result.error.message);
                }
            });
        } else {
            console.log(cal_list.error.message);
        }
        */

        console.log("Export ", ex_event);
    //});
});

// function dropup_active(){
//     if(dropup == false){
//         $('.dropup-menu').show({
//             duration: 500
//         });
//         $('.menu i').removeClass('fa-plus').addClass('fa-times');
//         dropup = true;
//     }
//     else{
//         $('.dropup-menu').hide({
//             duration: 500
//         });
//         $('.menu i').addClass('fa-plus').removeClass('fa-times');
//         dropup = false;
//     }
// }
