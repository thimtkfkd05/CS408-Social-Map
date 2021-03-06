var user_id;
var all_events;
var user_events;
var card_template = function(e) {
    var start = new Date(new Date(e.start).getTime() + 3600*1000*9).toISOString();
    var end = new Date(new Date(e.end).getTime() + 3600*1000*9).toISOString();
    return [
        '<div class="col-xs-6 event_card">',
            '<h3>' + e.title + '</h2>',
            '<div class="event_desc">',
                '<div class="desc_detail">' + e.description + (e.url ? '<br><br>Homepage : ' + '<a href="' + e.url + '" target="_blank">click here</a>' : '')  + '</div>',
                '<br><br>',
                'Schedule : ', e.open_day + ' ~ ' + e.close_day + ' / ' + start.substring(start.indexOf('T')+1, start.indexOf(':00.000Z')) + ' ~ ' + end.substring(end.indexOf('T')+1, end.indexOf(':00.000Z')),,
                (e.place && e.place.lat !== null ? '<br><br>Place : ' + '<a class="map-view" data-toggle="modal" data-target="#mapModal" data-lat="' + e.place.lat + '" data-lng="' + e.place.lng + '">' + '<i class="fa fa-map-marker"' + '></i> View Map' + '</a>' : ''),
                '<br><br>',
                'Recommended Date : ', e.recommend_date,
            '</div>',
            '<button class="btn btn-default' + (e.open_day !== e.close_day ? ' add_event_modal' : ' add_event') + '" data-id="' + e.id + (e.open_day !== e.close_day ? '" data-toggle = "modal" data-target ="#datemodal"' : '"') + '>Join this Event</button>',
        '</div>'
    ].join('');
};

var make_event_html = function(events) {
    var card_html = '';
    $('.div_page').remove();
    $('.page_loader').show();
    events.map(function(item, idx) {
        if (idx % 10 == 0) {
            card_html += '<div class="div_page page_' + parseInt(idx / 10, 10) + '" style="display: none;">';
        }
        if (idx % 2 == 0) {
            card_html += '<div class="event_card_wrapper">' + card_template(item);
        } else {
            card_html += card_template(item) + '</div>';
        }
        if (idx % 10 == 9) {
            card_html += '</div>';
        }
    });
    $('.page_loader').hide();
    $('#recommendation').append(card_html);
    $('.page_0').show();
    $('.event_desc .desc_detail').map(function(idx, obj) {
        if ($(obj).height() > 60) {
            $(obj).after('<a class="view_all" data-target="#descModal" data-toggle="modal" data-id="' + $(obj).parents('.event_card').find('button').data('id') + '"> ...view all description</a>');
            $(obj).addClass('long_desc');
        }
    });
};

var shorten_events = function(events) {
    while (events.indexOf('rm') > -1) {
        events.splice(events.indexOf('rm'), 1);
    }

    return events;
};

$.get('/event_get', {}, function(results) {
    if (results) {
        user_events = results;
    }
});

$(window).on('load', function() {
    var check = false;
    var getId = setInterval(function() {
        if (!check && gapi.auth2.getAuthInstance().currentUser.get().getId()) {
            check = true;
            $.post('/recommend_event', {
                user_id: gapi.auth2.getAuthInstance().currentUser.get().getId()
            }, function(events) {
                all_events = events;
                make_event_html(all_events);
                clearInterval(getId);
            });
        }
    }, 100);
    
    var page = 1;
    $(window).scroll(function() {
        if (Math.round($(window).scrollTop()) == $(document).height() - $(window).height()) {
            $('.page_' + page).length && $('.page_' + page).show();
            $('.event_desc .desc_detail').map(function(idx, obj) {
                if ($(obj).height() > 60) {
                    $(obj).after('<a class="view_all" data-target="#descModal" data-toggle="modal" data-id="' + $(obj).parents('.event_card').find('button').data('id') + '"> ...view all description</a>');
                    $(obj).addClass('long_desc');
                }
            });
            page++;
        }
    });
});

$(document).on('click', '.search_event', function() {
    var query = $('#msg').val().trim();
    var events = all_events.map(function(item) {
        if (query && (item.category && item.category.indexOf(query) > -1) || (item.title && item.title.indexOf(query) > -1) || (item.description && item.description.indexOf(query) > -1)) {
            return item;
        } else {
            return 'rm';
        }
    });

    make_event_html(shorten_events(events));
});

$(document).on('keyup', '#msg', function (e) {
    if (e.keyCode == 13) {
        $('.search_event').click();
    }
});

$(document).on('click', '.initialize_event', function() {
    $('#msg').val('');
    make_event_html(all_events);
});

$(document).on('change', '.event_category input[type="checkbox"]', function() {
    var checklist = '';
    $('.event_category input[type="checkbox"]').map(function(idx, obj) {
        if (obj.checked) {
            checklist += $(obj).val();
            checklist += '|';
        }
    });
    checklist = new RegExp(checklist.substring(0, checklist.length-1));
    
    var events = all_events;
    if (checklist) {
        events = all_events.map(function(item) {
            if (checklist.test(item.category)) {
                return item;
            } else {
                return 'rm';
            }
        });
    }
    
    make_event_html(shorten_events(events));
});

$(document).on('click', '.add_event_modal', function() {
    var event_id = $(this).data('id');
    var event_data;
    all_events.some(function(item) {
        if (item.id == event_id) {
            event_data = item;
            return true;
        } else return false;
    });

    $('#datemodal').on('shown.bs.modal', function () {
        $('#select_date').datetimepicker({
            format: 'YYYY/MM/DD',
            useCurrent: true,
            minDate: event_data.open_day,
            maxDate: event_data.close_day,
        });
    });

    var overlap_day_list = [];
    var get_user_time = function(time_string) {
        return new Date(time_string).getTime() - 3600*9000;
    };
    var get_event_date = function(user_time, time_string) {
        var user_string = new Date(user_time).toISOString();
        var user_day = user_string.substring(0, user_string.indexOf('T'));
        var event_time_string = time_string.substring(time_string.indexOf('T'), time_string.length);
        return user_day + event_time_string;
    };
    var get_event_time = function(time_string) {
        return new Date(time_string).getTime();
    };
    var get_day = function(time_string) {
        return time_string.substring(0, time_string.indexOf('T')).replace(/\-/g, '/');
    };
    var check_overlap = function(s1, e1, s2, e2) {
        if (s1 < s2 && s2 < e1) return true;
        else if (s1 < e2 && e2 < e1) return true;
        else if (s2 < s1 && s1 < e2) return true;
        else if (s2 < e1 && e1 < e2) return true;
        else return false;
    };
    user_events.map(function(e) {
        var e_start_time = get_user_time(e.start);
        var e_end_time = get_user_time(e.end);
        var start_time = get_event_time(get_event_date(e_start_time, event_data.start));
        var end_time = get_event_time(get_event_date(e_end_time, event_data.end));
        if (check_overlap(start_time, end_time, e_start_time, e_end_time)) {
            overlap_day_list.push(get_day(e.end));
        }
    });
    
    $(document).on('click', '.join_btn', function () {
        var selected_day = $('#select_date').data().date;
        if (!selected_day || overlap_day_list.indexOf(selected_day) > -1 || new Date(selected_day) < new Date(event_data.open_day) || new Date(selected_day) > new Date(event_data.close_day)) {
            $('.warning_msg').show();
            setTimeout(function () {
                $('.warning_msg').hide();
            }, 2000);
        } else {
            $.post('/add_open_event', {
                id: event_id,
                selected_day: selected_day
            }, function(err) {
                if (err) alert('Error ocurred. Please try again.');
                else location.reload();
            })
        }
    });
});

$(document).on('click', '.add_event', function() {
    $.post('/add_open_event', {
        id: $(this).data('id')
    }, function(err) {
        if (err) alert('Error ocurred. Please try again.');
        else location.reload();
    });
});

$(document).on('click', '#recommend_btn', function() {
    $.post('/recommend_event', {}, function(recommended_events) {
        if (!recommended_events) alert('Error ocurred. Please try again.');
        else {
            all_events = recommended_events;
            make_event_html(recommended_events);
        }
    });
});

$(document).on('click','.map-view', function () {
    var place = {
        lat: $(this).data('lat'),
        lng: $(this).data('lng')
    };
    $('#mapModal').on('shown.bs.modal',function () {
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 17,
            zoomControl: true,
            center: place
        });

        var marker = new google.maps.Marker({
            position: place,
            map: map
        });
        $('.map_loader').hide();
    }).on('hidden.bs.modal', function(){
        $('#map').empty();
        $('.map_loader').show();
    });
});

$(document).on('click', '.view_all', function() {
    var detail = $(this).parent().find('.desc_detail').html();
    $('#descModal').on('shown.bs.modal', function() {
        $('#descModal #description_detail').html(detail);
    }).on('hidden.bs.modal', function() {
        $('#descModal #description_detail').empty();
    });
});
