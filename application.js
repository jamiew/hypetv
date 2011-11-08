function debug(){
  try { console.log(arguments); } catch(e){}
}

// Set blog name if passed like http://reblogvision.com/#jamiew.tumblr.com
var blogname = "jamiew.tumblr.com";
if(window.location.hash){
  blogname = window.location.hash.replace(/^\#/,'');
  debug("Set blogname to "+blogname);
}

// Load VHX player
$(document).ready(function(){
  $('.video', '.video a').click(function(){
    alert("Playing dat video");
    return false;
  });

  $('#megaplaya').flash({
    swf: 'http://vhx.tv/embed/megaplaya.swf',
    width: '100%',
    height: '100%',
    allowFullScreen: true,
    allowScriptAccess: "always"
  });

});

// Megaplaya calls this function when it's ready
var megaplaya = false;
function megaplaya_loaded(){
  megaplaya = $('#megaplaya').children()[0];
  megaplaya_addListeners();
  load_videos();
}

function megaplaya_call(method){
  // "pause" => megaplaya.api_pause();
  (megaplaya["api_" + method])();
}

function megaplaya_addListeners(){
  var events = ['onVideoFinish', 'onVideoLoad', 'onError', 'onPause', 'onPlay', 'onFullscreen', 'onPlaybarShow', 'onPlaybarHide', 'onKeyboardDown'];

  $.each(events, function(index, value) {
    megaplaya.api_addListener(value, "function() { megaplaya_callback('" + value + "', arguments); }")
  });
}

function megaplaya_callback(event_name, args) {
  switch (event_name) {
    case 'onVideoLoad':
      var video = megaplaya.api_getCurrentVideo();
      setTimeout(function(){
        megaplaya.api_growl("Now Playing: " + video.post_title)
      }, 1000);
      break;
    default:
      debug("Unhandled megaplaya event: "+event_name);
      break;
  }
}

function load_videos() {
  debug("load_videos()...");
  $.ajax({
    type: "GET",
    url: "http://api.hypem.com/api/experimental_video_latest",
    dataType: 'jsonp',
    success: load_videos_callback,
    error: function(){ alert("Error fetching data") }
  });
}

function load_videos_callback(data){
  debug("load_videos_callback()...");
  debug(data);
  debug(data[0]);

  // // Set blog info
  // var blog = data.response.blog;
  // $('#video-info').hide();
  // $('#video-info .title').html('<a target="_blank" href="'+video-info.url+'">'+video-info.title+'</a>');
  // $('#video-info .url').html('<a target="_blank" href="'+video-info.url+'">'+video-info.url.replace('http://','').replace(/\/$/,'')+'</a>');
  // $('#video-info .description').html(video-info.description);
  // // Tumblr API doesn't have avatar :-(
  // $('#video-info').fadeIn('slow');
  //
  // Process and load videos
  var videos = $.map(data, function(item){
    var video = {
          site: item.hreftitle,
          id: item.url,
          post_title: item.posttitle,
          post_url: item.postentryurl,
          site_id: item.siteid,
          created_at: item.dateposted,
        }
    if(item.hreftitle == 'YOUTUBE') {
      video.url = "http://www.youtube.com/watch?v="+video.id;
      // debug("Matched YouTube: "+video.url);
    }
    else if(item.hreftitle == 'VIMEO'){
      video.url = "http://vimeo.com/"+video.id;
      // debug("Matched Vimeo: "+video.url);
    }
    else {
      debug("WARN: no match for site "+video.site);
    }
    return video;
  });

  if (videos) {
    update_video_list(videos);
    megaplaya.api_growl(videos.length+" videos loaded...");
    megaplaya.api_playQueue(videos);
  }
}

function update_video_list(videos) {
  debug("update_video_list()...", videos);
  $('#videos ul').html('');
  $.each(videos, function(i, video) {
    debug("Adding video #"+i, video);
    $('#videos ul').append('<li>'+
        '<div class="thumbnail"><a href="#"><img src="http://b.vimeocdn.com/ts/167/282/167282503_200.jpg" /></a></div>' +
        '<div class="title"><a href="#">Video '+(i+1)+'</a></div>' +
        '<div class="details">Site #' + video.site_id + ' <a href="'+video.post_url+'">Link</a></div>' +
      '</li>');
  });
}
