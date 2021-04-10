# Youtube Dynamic Transcripts (ytdt)

Tool to create a dynamic transcript box alongside any YouTube embedded video. Current caption is highlighted while video plays, and clicking any caption will seek video to the time stamp at which it plays.

IMPORTANT NOTE: Unfortunately, this tool will work ONLY with uploaded or typed captions. YouTube does not make its automatic captions available for use outside of its own proprietary code.

This tool has no runtime dependencies except the YouTube API itself.

## Installing

### General method
1. Include the ytdt script from your server or from a CDN. (See the github Releases screen for jsDelivr CDN links.)
1. Include the project styles in a `<link>` or CSS `@import` statement - OR - write your own styles, targeting the same classes.
1. Install the YouTube API. See the [YouTube documentation](https://developers.google.com/youtube/iframe_api_reference) for more detail.
    1. Ensure the embed frame has the URL param `enablejsapi=1` in its video URL.
    1. Include the API script (`https://www.youtube.com/iframe_api`)
1. For each video you want to add a transcript for, call the `ytdt.init` function.

#### ytdt.init
`ytdt.init` requires the following paramaters:
* `videoID`: The identifier YouTube uses to find your video. This can be found in the YouTube url, as the value of the `v=` URL param.
* `lang`: The ISO 639-1 language code for the subtitle/caption track you want to create your transcript from.
    * Note: `lang` must be exact; for example, if the caption is marked as `en-us`, you must pass `"en-us"`, *not* `"en"`.
* `transcriptName`: Youtube's name for the caption track. 
    * Note: Not all caption tracks have a name. If your track does have one, you must provide it; if it does not, you must omit this parameter or pass `undefined`.
* `frameID` (optional): The ID of the DOM element in which the YouTube player is embedded. (Usually an iframe.)
    * Default: If `frameID` is not passed, `videoID` will be used in its place.
* `insertContainer` (optional): A callback function. Will be passed the DOM element in which the transcript is displayed. The callback should insert this element into the page at the appropriate point.
    * Default: If `insertContainer` is not passed, the transcript will be inserted immediately after the video.

#### Finding the right values for `lang` and `transcriptName`
Youtube's captioning API is inconsistent with language codes and names, so it can be difficult to guess the right values
just by looking at the player. The best way to determine these values is to visit the following URL:

`https://video.google.com/timedtext?type=list&v=[YOUR VIDEO ID]`

This will list the available tracks in a human-readable XML format. Look for the `lang` and `name` attributes. If `name`
is either absent or is an empty string, you should omit it when initializing a transcript for that track.

### Squarespace (Pro Required)
Edit your proper videoID, lang, and name into the snippet below, and install it in a code block. You will also need to add custom CSS.

Example snippet for installing on a Squarespace page:
```
<script src='https://cdn.jsdelivr.net/gh/DMR-coding/youtube-dynamic-transcripts@0.4.1/dist/youtube-dynamic-transcripts.min.js'></script>
<script src='https://www.youtube.com/iframe_api'></script>
<script>
  var selector = '.sqs-video-wrapper iframe';
  
  function init(){
      window.ytdt.init("__yybprXHGo", "en-US", undefined, document.querySelector(selector).id,
    function(container) {
      document.getElementById("ytdt-container-target").append(container);
    });
  }
  window.addEventListener('load', function(){
  	Y.on('available', init, selector)
  });

</script>

<span id="ytdt-container-target" class='sqsrte-small'/> 
```

## Acknowledgements
Thanks to [Erlend Thune](https://github.com/erlendthune) for writing the demo application on which the basic principles of this tool were based.
