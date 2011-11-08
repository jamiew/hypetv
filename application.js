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
  $('#megaplaya').flash({
    swf: 'http://vhx.tv/embed/megaplaya.swf',
    width: '100%',
    height: '100%',
    allowFullScreen: true,
    allowScriptAccess: "always"
  });

  $('.video', '.video a').click(function(){
    alert("Playing dat video");
    return false;
  });
});

// Megaplaya calls this function when it's ready
var megaplaya = false;
function megaplaya_loaded(){
  megaplaya = $('#megaplaya').children()[0];
  load_videos();
}

function load_videos(){
  $.ajax({
    type: "GET",
    url: "http://api.tumblr.com/v2/blog/"+blogname+"/posts/video?api_key=PyezS3Q4Smivb24d9SzZGYSuhMNPQUhMsVetMC9ksuGPkK1BTt&jsonp=load_videos_callback",
    dataType: "jsonp"
  });
}

var tumblr = false; // REMOVEME
function load_videos_callback(data){
  tumblr = data; // REMOVEME
  debug(data);

  // Set blog info
  var blog = data.response.blog;
  $('#video-info').hide();
  $('#video-info .title').html('<a target="_blank" href="'+video-info.url+'">'+video-info.title+'</a>');
  $('#video-info .url').html('<a target="_blank" href="'+video-info.url+'">'+video-info.url.replace('http://','').replace(/\/$/,'')+'</a>');
  $('#video-info .description').html(video-info.description);
  // Tumblr API doesn't have avatar :-(
  $('#video-info').fadeIn('slow');

  // Process and load videos
  var videos = $.map(tumblr.response.posts, function(item){
    var raw_url = item.player[0].embed_code.match(/src=\"([^\"]+)/)[1];
    vimeo_url = match_vimeo_video(raw_url);
    youtube_url = match_youtube_video(raw_url);
    if(vimeo_url && youtube_url) {
      debug("Matched both Vimeo & YouTube, using Vimeo: "+vimeo_url);
      url = vimeo_url;
    }
    else if(vimeo_url){
      debug("Matched Vimeo: "+vimeo_url);
      url = vimeo_url;
    }
    else if(youtube_url){
      debug("Match YouTube: "+youtube_url);
      url = youtube_url;
    }
    else {
      debug("No match for "+raw_url);
      url = undefined;
    }
    return {raw_url: raw_url, url: url}
  });

  if (videos) {
    megaplaya.api_playQueue(videos);
    $('#video-info').delay(7000).slideUp('fast');
  }
}

function match_vimeo_video(url){
  patterns = [
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/(\d+)/
  ];
  return match_video_from_patterns(url, "http://vimeo.com/", patterns);
}

function match_youtube_video(url){
  patterns = [
    /v\/([^&#\?"\\]+)/,
    /v=([^&#\?"\\]+)/,
    /youtu\.be\/([^&#\?"\\])/
  ];
  return match_video_from_patterns(url, "http://www.youtube.com/watch?v=", patterns);
}

function match_video_from_patterns(url, base_url, patterns){
  var id = false;
  for(i = 0; regex = patterns[i]; i++){
    var matches = url.match(regex);
    if(!id && matches != null && matches.length > 0){
      id = matches[1];
      url = base_url + id;
    }
    // debug("url="+url);
  }
  return url;
}
