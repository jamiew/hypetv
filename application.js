function debug(){
  try { console.log(arguments); } catch(e){}
}

var blogname = "popular";
if(window.location.hash){
  blogname = window.location.hash.replace(/^\#/,'');
  debug("Set blogname to "+blogname);
}

// Load VHX player
$(document).ready(function(){
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
  $.history.init(function(hash){
    if(hash == "") {
      blogname = 'popular'; // default
    } else {
      debug("restore the state from hash");
      blogname = window.location.hash.replace(/^\#/,'');
    }
    load_videos();
  },
  { unescape: ",/" });
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
      var video = megaplaya.api_getCurrentVideo(),
          index = megaplaya.api_getCurrentVideoIndex();
      var item = $('#video_'+index);
      $('#videos li.selected').removeClass('selected');
      item.addClass('selected');
      // megaplaya.api_growl("Now Playing: " + video.title)
      break;
    default:
      // debug("Unhandled megaplaya event: "+event_name);
      break;
  }
}

var hype_list = undefined;
function load_videos() {
  debug("load_videos()...", blogname);
  $.ajax({
    type: "GET",
    url: "http://api.hypem.com/api/experimental_video_"+blogname,
    dataType: 'jsonp',
    success: load_videos_callback,
    error: function(){ alert("Error fetching data") }
  });
  $('#toggle_popular').addClass('selected');
}

var blog_posts = undefined;
function load_videos_callback(data){
  debug("load_videos_callback()...");
  debug(data);
  debug(data[0]);

  var i = 0;
  var videos = $.map(data, function(item){
    var video = {
      internal_id: i,
      id: item.url,
      site: item.hreftitle,
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
    i++;
    return video;
  });
  blog_posts = videos;

  $('#videos ul').html('');
  if (videos) {
    megaplaya.api_playQueue(videos);
    update_video_list(videos);
    $('#videos li:first').addClass('selected');
  }
}

function update_video_list(videos) {
  debug("update_video_list(): loading "+videos.length+" videos...", videos);
  $.each(videos, function(i, video){

    $('#videos ul').append('<li id="video_'+video.internal_id+'">'+
        '<div class="thumbnail"></div>' +
        '<div class="title">'+video.post_title+'</div>' +
        '<div class="details"></div>' +
        '<div class="clear"></div>' +
      '</li>');

    // TODO need batch url support in vhx api
    // load videolists / inject into megaplaya only after the one bulk-call has returned
    $.ajax({
      type: "GET",
      url: "http://api.vhx.tv/info.json?callback=load_video_info&url="+video.url,
      dataType: 'jsonp',
      success: load_video_info,
      error: function(){ alert("Error fetching data") }
    });
  });

  // TODO use jquery.live()
  $('#videos li').click(function(){
    var index = this.id.replace('video_', '');
    debug("video index => "+index);
    megaplaya.api_playQueueAt(index);
    return false;
  });

  $('#videos li a').click(function(){
    debug("CLICKED LINK...");
    $(this).parent().click();
    return false;
  });

  // Select which page we just loaded
  $('.toggles.selected').removeClass('selected');
  $('#toggle_'+blogname).addClass('selected');

}

function load_video_info(data) {
  var video = data.video;

  // Get blog info out of original array
  // FIXME invert hash by url and do this more easily
  for (var j = 0; j < blog_posts.length; j++) {
    post = blog_posts[j];
    // debug(post);
    if (post.url == video.url) {
      video.internal_id = post.internal_id;
      video.post_url = post.post_url;
      video.post_title = post.post_title;
      video.site_id = post.site_id;
      debug("matched "+video.internal_id+" => "+video.url);
      break;
    }
  }

  $('#video_'+video.internal_id+' .thumbnail').html('<a href="'+video.url+'" target="_blank"><img src="'+video.thumbnail_url+'" /></a>');
  $('#video_'+video.internal_id+' .title').html('<a href="'+video.url+'" target="_blank">'+video.title+'</a>');
  $('#video_'+video.internal_id+' .details').html('<span>Posted by <a href="#blog-'+video.site_id+'">blog #'+video.site_id+'</a></span><br /><a href="'+video.post_url+'" target="_blank">[link]</a>');
}


