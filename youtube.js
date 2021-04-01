window.ytdt = window.ytdt || {}

const LOADING = 'Loading transcript...'
const FAILED_LOAD = '⚠️ Could not load transcript.'

// https://medium.com/@pointbmusic/youtube-api-checklist-c195e9abaff1
window.ytdt.youtube = (function () {
  const hrefPrefix = 'https://video.google.com/timedtext?v='
  const transcriptArr = []
  let bootstrapped = false
  const pendingInits = []

  function Transcript (videoId, language, name) {
    let href = hrefPrefix + videoId
    if (language) {
      href = href + '&lang=' + language
    }
    if (name) {
      href = href + '&name=' + name
    }

    // Array of captions in video
    let captionsLoaded = false

    // Timeout for next caption
    let captionTimeout = null

    let captions = null

    // Keep track of which captions we are showing
    let currentCaptionIndex = 0
    let nextCaptionIndex = 0

    this.$transcript = $('#' + 'transcript-' + videoId)

    this.$transcript.text(LOADING)

    this.player = new YT.Player(videoId, {
      videoId: videoId,
      events: {
        onReady: window.onPlayerReady,
        onStateChange: window.onPlayerStateChange
      }
    })

    const findCaptionIndexFromTimestamp = function (timeStamp) {
      let start = 0
      let duration = 0
      let i = 0
      const il = captions.length

      for (; i < il; i++) {
        start = Number(getStartTimeFromCaption(i))
        duration = Number(getDurationFromCaption(i))

        // Return the first caption if the timeStamp is smaller than the first caption start time.
        if (timeStamp < start) {
          break
        }

        // Check if the timestamp is in the interval of this caption.
        if ((timeStamp >= start) && (timeStamp < (start + duration))) {
          break
        }
      }
      return i
    }

    const clearCurrentHighlighting = function () {
      const timeStampId = getTimeIdFromTimestampIndex(currentCaptionIndex)
      $('#' + timeStampId).css('background-color', '')
    }

    const highlightNextCaption = function () {
      const timestampId = getTimeIdFromTimestampIndex(nextCaptionIndex)
      $('#' + timestampId).css('background-color', 'yellow')
    }

    const calculateTimeout = function (currentTime) {
      const startTime = Number(getStartTimeFromCaption(currentCaptionIndex))
      const duration = Number(getDurationFromCaption(currentCaptionIndex))
      const timeoutValue = startTime - currentTime + duration
      return timeoutValue
    }

    this.setCaptionTimeout = function (timeoutValue) {
      if (timeoutValue < 0) {
        return
      }

      clearTimeout(captionTimeout)

      const transcript = this

      captionTimeout = setTimeout(function () {
        transcript.highlightCaptionAndPrepareForNext()
      }, timeoutValue * 1000)
    }

    const getStartTimeFromCaption = function (i) {
      if (i >= captions.length) {
        return -1
      }
      return captions[i].getAttribute('start')
    }
    const getDurationFromCaption = function (i) {
      if (i >= captions.length) {
        return -1
      }
      return captions[i].getAttribute('dur')
    }
    const getTimeIdFromTimestampIndex = function (i) {
      const strTimestamp = '' + i
      return 't' + strTimestamp
    }

    /// ///////////////
    // Public functions
    /// //////////////

    // This function highlights the next caption in the list and
    // sets a timeout for the next one after that.
    // It must be public as it is called from a timer.
    this.highlightCaptionAndPrepareForNext = function () {
      clearCurrentHighlighting()
      highlightNextCaption()
      currentCaptionIndex = nextCaptionIndex
      nextCaptionIndex++

      const currentTime = this.player.getCurrentTime()
      const timeoutValue = calculateTimeout(currentTime)

      if (nextCaptionIndex <= captions.length) {
        this.setCaptionTimeout(timeoutValue)
      }
    }

    // Called if the user has dragged the slider to somewhere in the video.
    this.highlightCaptionFromTimestamp = function (timeStamp) {
      clearCurrentHighlighting()
      nextCaptionIndex = findCaptionIndexFromTimestamp(timeStamp)
      currentCaptionIndex = nextCaptionIndex

      const startTime = Number(getStartTimeFromCaption(currentCaptionIndex))
      const currentTime = this.player.getCurrentTime()

      let timeoutValue = -1
      if (timeStamp < startTime) {
        timeoutValue = startTime - currentTime
      } else {
        highlightNextCaption()
        timeoutValue = calculateTimeout(currentTime)
      }
      this.setCaptionTimeout(timeoutValue)
    }

    this.transcriptLoaded = function (transcript) {
      if (!transcript) {
        this.$transcript.text(FAILED_LOAD)
        return
      }

      let start = 0
      captions = transcript.getElementsByTagName('text')
      let srtOutput = "<div class='btnSeek' id='btnSeek' data-seek='0'>0:00</div>"

      for (let i = 0, il = captions.length; i < il; i++) {
        start = +getStartTimeFromCaption(i)

        const captionText = captions[i].textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const timestampId = getTimeIdFromTimestampIndex(i)
        srtOutput += "<span class='btnSeek' data-seek='" + start + "' id='" + timestampId + "'>" + captionText + '</span> '
      }

      this.$transcript.append(srtOutput)
      captionsLoaded = true
    }

    this.getTranscriptId = function () {
      return 'transcript-' + videoId
    }
    this.getVideoId = function () {
      return videoId
    }

    this.getTranscript = function () {
      const oTranscript = this
      $.ajax({
        url: href,
        type: 'GET',
        data: {},
        success: function (response) {
          oTranscript.transcriptLoaded(response)
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.log('Error during GET')
        }
      })
    }

    this.playerPlaying = function () {
      if (!captionsLoaded) {
        return
      }

      const currentTime = this.player.getCurrentTime()
      this.highlightCaptionFromTimestamp(currentTime)
    }
    this.playerNotPlaying = function (transcript) {
      if (!captionsLoaded) {
        return
      }
      clearTimeout(captionTimeout)
    }
  }

  // Called when user clicks somewhere in the transcript.
  $(function () {
    $(document).on('click', '.btnSeek', function () {
      const seekToTime = $(this).data('seek')
      const transcript = window.ytdt.youtube.getTranscriptFromTranscriptId($(this).parent().attr('id'))
      transcript.player.seekTo(seekToTime, true)
      transcript.player.playVideo()
    })
  })

  // These functions must be global as YouTube API will call them.
  const previousOnYouTubePlayerAPIReady = window.onYouTubePlayerAPIReady
  window.onYouTubePlayerAPIReady = function () {
    if (previousOnYouTubePlayerAPIReady) {
      previousOnYouTubePlayerAPIReady()
    }
    window.ytdt.youtube.APIReady()
  }

  // The API will call this function when the video player is ready.
  // It can be used to auto start the video f.ex.
  window.onPlayerReady = function (event) {
  }

  // The API calls this function when the player's state changes.
  //    The function indicates that when playing a video (state=1),
  //    the player should play for six seconds and then stop.
  window.onPlayerStateChange = function (event) {
    console.log('onPlayerStateChange ' + event.data)
    const transcript = window.ytdt.youtube.getTranscriptFromVideoId(event.target.getIframe().id)
    if (event.data === YT.PlayerState.PLAYING) {
      transcript.playerPlaying()
    } else {
      transcript.playerNotPlaying()
    }
  }

  return {
    getTranscriptFromTranscriptId (transcriptId) {
      for (let index = 0; index < transcriptArr.length; ++index) {
        if (transcriptArr[index].getTranscriptId() === transcriptId) {
          return transcriptArr[index]
        }
      }
      return null
    },
    getTranscriptFromVideoId (videoId) {
      for (let index = 0; index < transcriptArr.length; ++index) {
        if (transcriptArr[index].getVideoId() === videoId) {
          return transcriptArr[index]
        }
      }
      return null
    },

    APIReady: function () {
      if (!bootstrapped) {
        bootstrapped = true

        while (pendingInits.length > 0) {
          window.ytdt.youtube.init.apply(this, pendingInits.pop())
        }
      }
    },
    init: function (videoId, language, name) {
      if (bootstrapped) {
        const oTranscript = new Transcript(videoId, language, name)
        oTranscript.getTranscript()
        transcriptArr.push(oTranscript)
      } else {
        pendingInits.push([videoId, language, name])
      }
    }
  }
}())
// Everything is ready, load the youtube iframe_api
$.getScript('https://www.youtube.com/iframe_api')
