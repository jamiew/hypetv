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
      debug("initialize your app normally");
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
      debug("ONVIDEOLOAD", item);
      $('#videos li.selected').removeClass('selected');
      megaplaya.api_growl("Now Playing: " + video.post_title)
      break;
    default:
      debug("Unhandled megaplaya event: "+event_name);
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
  blog_posts = videos;

  if (videos) {
    update_video_list(videos);
    megaplaya.api_playQueue(videos);
  }
}

function update_video_list(videos) {
  debug("update_video_list()...", videos);
  $('#videos ul').html('');
  debug("loading "+videos.length+" videos...");
  $.each(videos, function(i, video){
    // TODO batch url support in vhx api
    $.ajax({
      type: "GET",
      url: "http://api.vhx.tv/info.json?callback=load_video_info&url="+video.url,
      dataType: 'jsonp',
      success: load_video_info,
      error: function(){ alert("Error fetching data") }
    });
  });

  debug('~~~~ #toggle_'+blogname);
  $('.toggles.selected').removeClass('selected');
  $('#toggle_'+blogname).addClass('selected');

}

var video_i = 0;
function load_video_info(data) {
  var video = data.video;
  var i = video_i;
  // debug("Adding video #"+i, video);
  if(video.post_url == undefined) video.post_url = video.url; // FIXME save article url for these too...

  // Get blog info out of original array
  // FIXME invert hash by url and do this more easily
  for(var j = 0; j < blog_posts.length; j++) {
    post = blog_posts[j];
    // debug(post);
    video.post_url == post.post_url;
    video.post_title = post.post_title;
    video.site_id = post.site_id;
  }

  $('#videos ul').append('<li id="video_'+i+'">'+
      '<div class="thumbnail"><a href="'+video.url+'" target="_blank"><img src="'+video.thumbnail_url+'" /></a></div>' +
      '<div class="title"><a href="'+video.url+'" target="_blank">'+video.title+'</a></div>' +
      '<div class="details"><em><a href="#'+video.site_id+'">Blog '+video.site_id+'</a></em>&nbsp;&ndash;<a href="'+video.post_url+'" target="_blank">'+video.post_title+'</a></div>' +
      '<div class="clear"></div>' +
    '</li>');

  // TODO use jquery.live()
  $('#video_'+i+'').click(function(){
    var index = this.id.replace('video_', '');
    debug("video index => "+index);
    megaplaya.api_playQueueAt(index);
    return false;
  });

  $('#video_'+i+' a').click(function(){
    debug("CLICKED LINK...");
    $(this).parent().click();
    return false;
  });

  video_i++;
}


