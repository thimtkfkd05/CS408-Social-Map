var selected;
var place;
var dropup = false;
var full_event = [
/*    {
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
    }*/
];

$(window).on('load', function() {
    var init_calendar = function() {
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
    };
   
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        $.get('/event_get', {
            user_id: gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId()
        }, function(events) {
            full_event = events;
            init_calendar();
        });
    } else {
        init_calendar();
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
        var calendarId = '';
        gapi.client.load('calendar', 'v3', function() {
            gapi.client.calendar.calendarList.list({}).execute(function(cal_list) {
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
                        'calendarId': calendarId
                    };
                    if (start_date) {
                        options.timeMin = start_date.toJSON();
                    }
                    if (end_date) {
                        options.timeMax = end_date.toJSON();
                    }

                    gapi.client.calendar.events.list(options).execute(function(result) {
                        if (result && !result.error) {
                            console.log(result.items);
                            var events = result.items;
                            var new_events = [];
                            events.map(function(item) {
                                var new_item = {
                                    id: item.id,
                                    start: new Date(item.start.date || item.start.dateTime).toISOString(),
                                    end: new Date(item.end.date || item.end.dateTime).toISOString(),
                                    Allday: !!item.start.date,
                                    title: item.summary,
                                    description: item.description || '',
                                    place: item.location || '',
                                    user_id: gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId()
                                };

                                new_events.push(new_item);
                            });

                            async.map(new_events, function(item, next) {
                                if (item.place) {
                                    var req_option = {
                                        host: 'maps.googleapis.com',
                                        port: 443,
                                        path: btoa('/maps/api/place/textsearch/json?query=' + encodeURIComponent(item.place) + '&key=AIzaSyBVhAysUuLePfYO9EKf-de-XBfzU2Vg1fk'),
                                        method: 'GET',
                                        option: 'results,0,geometry,location'
                                    };

                                    $.get('/https_get', req_option, function(place_result) {
                                        if (place_result) {
                                            item.place = place_result;//place_result.results[0].geometry.location;
                                            next(null, item);
                                        } else {
                                            item.place = {'lat': null, 'lng': null};
                                            next(null, item);
                                        }
                                    });
                                } else {
                                    item.place = {'lat': null, 'lng': null};
                                    next(null, item);
                                }
                            }, function(async_err, results) {
                                $.post('/event_save', {
                                    events: results
                                }, function(saved) {
                                    if (!saved || saved.err) {
                                        console.log(saved.err);
                                    } else {
                                        console.log('import complete! ', results);

                                        $('#import_google .close').click();
                                        $('#start_date input,#end_date input').val('');
                                        start_picker.DateTimePicker.destroy();
                                        end_picker.DateTimePicker.destroy();
                                    }
                                });
                            });
                        } else {
                            console.log(result.error.message);
                        }
                    });
                } else {
                    console.log(cal_list.error.message);
                }
            });
        });
    }
});

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

    gapi.client.load('calendar', 'v3', function() {
        gapi.client.calendar.calendarList.list({}).execute(function(cal_list) {
        //$.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {}, function(cal_list) {
            if (cal_list && !cal_list.error) {
                cal_list.items.some(function(cal) {
                    if (cal.accessRole == 'owner') {
                        calendarId = cal.id;
                        return true;
                    } else {
                        return false;
                    }
                });
                
                var place = '';
                var export_work = function() {
                    var options = {
                        calendarId: calendarId,
                        iCalUID: ex_event.id + '@google.com',
                        start: {
                            dateTime: new Date(ex_event.start).toJSON()
                        },
                        end: {
                            dateTime: new Date(ex_event.end).toJSON()
                        },
                        summary: ex_event.title,
                        description: ex_event.description || ''
                    };
                    if (place) {
                        options.place = place;
                    }

                    gapi.client.calendar.events.import(options).execute(function(result) {
                    //$.post('https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events/import', options, function(result) {
                        if (result && !result.error) {
                            console.log('Export Success!');
                        } else {
                            console.log(result.error.message);
                        }
                    });
                };

                if (ex_event.place && ex_event.place.lat) {
                    $.get('/https_get', {
                        host: 'maps.googleapis.com',
                        port: 443,
                        path: btoa('/maps/api/place/nearbysearch/json?location=' + ex_event.place.lat + ',' + ex_event.place.lng + '&radius=50&key=AIzaSyBVhAysUuLePfYO9EKf-de-XBfzU2Vg1fk'),
                        method: 'GET',
                        option: 'results,0,name'
                    }, function(place_result) {
                        export_work();
                    });
                } else {
                    export_work();
                }

            } else {
                console.log(cal_list.error.message);
            }

            console.log("Export ", ex_event);
        });
    });
});

$(document).on('click', '.modification_btn', function() {
    console.log(this);
    var clicked_event_id = $(this).data("id");
    console.log(clicked_event_id);
    var result = full_event.filter(function(v) {
        return v.id === clicked_event_id; // Filter out the appropriate one
    });

    console.log(clicked_event_id);
    $.get('/one_get', {
        id: clicked_event_id
    });

});