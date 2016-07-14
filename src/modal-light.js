/*!
 * modal-light 
 * v1.0.0
 * (https://github.com/gionatan-lombardi/modal-light)
 * Copyright (c) 2016 Gionatan Lombardi
 * Licensed under the MIT license
 */

(function(window) {

'use strict';
   
// Utility functions

/**
 * forEachNode loops over a DOM NodeList
 * and executes a provided function once per HTML element. 
 * @param {NodeList} nodeList - an existing DOM NodeList
 * @param {function} todo - the function to execute once per element
 * @returns {NodeList} the updated NodeList
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList#Example}
 * @example
 * // returns [li.element-0, li.element-1, li]
 * <ul class="forEachNode">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 * var nodeList1 = document.querySelectorAll('.forEachNode li');
 * var nodeList1 = jVg.forEachNode(nodeList1, function(el, i) {
 *   if (i == 2)
 *     return 'break';
 *   el.classList.add('element-' + i);
 * })
 */
function forEachNode(nodeList, todo) {
  for (var i = 0, l = nodeList.length; i < l; ++i) {
    var el = nodeList[i];
    // The callback takes as params the current element and the index
    var o = todo(el,i);
    // If the callback returns the string "break" the loop'll be stopped
    if ( o === "break") break;
  }
  return nodeList;
}

/**
 * extend takes a list of objects
 * and returns a new one with the objects merged,
 * If it finds properties with the same name, it overwrites the oldest.
 * @param {object} out - a list of objects
 * @returns {object} out - an object with the properties
 * merged or overwritten.
 * @see  {@link http://youmightnotneedjquery.com/#deep_extend}
 * @example
 * // returns {'bar': true, 'baz': [1,2,3], 'foo': 3}
 * jVg.extend({'foo': 2, 'bar': true}, {'foo': 3, 'baz': [1,2,3]})
 */
function extend(out) {
  out = out || {};
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    if (!obj)
      continue;
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = extend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }
  return out;
}

var buildObj = {

  handleEvent: function(e) {

    var self = this;

    // Prevents anchor default behaviour
    e.preventDefault();

    // Gets the href attribute
    var elHref = e.currentTarget.getAttribute('href');

    // Autoplay options for video links
    var autoplay = e.currentTarget.dataset.autoplay;

    // Checks if the href is not a page anchor
    if ( elHref == "#" ) {
      console.log('ModalLight - 😔 sorry your link is not valid.');
      return false;
    } 

    // Creates the modal and a inner div for css styling
    self.modal = self.createElement('div', 'ModalLight-modal', document.body);
    var modalInner = self.createElement('div', 'ModalLight-inner', self.modal);
    // Creates modal closer button
    self.closer = self.createElement('button', 'ModalLight-closer', self.modal);
    self.closer.type = "button";
    self.closer.setAttribute('aria-label', 'Close modal');

    // Add a class to the modal for css transitions
    setTimeout( function () {
      self.modal.classList.add('is-visible');
    }, 0)

    // Adds the eventListener to the closer
    self.closer.addEventListener('click', function(e) {
      self.closeModal(e, self);
    });

    // Checks if it's a Youtube video
    if ( self.isYoutubeVideo(elHref) ) {
      self.createYoutubeEmbed( modalInner, self.isYoutubeVideo(elHref), autoplay )
    }

    // Checks if it's a Vimeo video
    if ( self.isVimeoVideo(elHref) ) {
      self.createVimeoEmbed( modalInner, self.isVimeoVideo(elHref), autoplay )
    }


  },

  /**
   * closeModal removes the modal from the DOM.
   * @param  {self.closer#event:click} event
   * @listens self.closer#event
   * @param {Object} self - the library this object.
   * @example
   * closeModal(event, this);
   * @url: https://developers.google.com/youtube/iframe_api_reference#Accessing_and_Modifying_DOM_Nodes
   */
  closeModal: function closeModal(e, self) {

    self.modal.classList.remove('is-visible');
    if (self.videoPlayer) {
      self.videoPlayer.stopVideo();
      self.videoPlayer.destroy();
    }
    if (self.vimeoPlayer) {
      self.vimeoPlayer.destroy();
      self.vimeoPlayer = false;
    }
    setTimeout( function () {
      var removedModal = document.body.removeChild(self.modal);
    }, 1000);

  },

  /**
   * createElement creates a DOM element and appends to a given parent node.
   * @param {string} tag - the tag name of the new element.
   * @param {string || false} className - the CSS class to add to the new element.
   * @param {DOM node} elToAppend - the parent element where to append the new element
   * @returns {DOM node} returns the created DOM node
   * @example
   * createElement("p", "myNewClass", document.body); // returns the <p> element
   */
  createElement: function createElement(tag, className, elToAppend) {

    var el = document.createElement(tag);
    if (className) el.classList.add(className);
    elToAppend.appendChild(el);
    return el;

  },

  /**
   * createYoutubeEmbed creates a youtube video player with the Youtube API.
   * @param {DOM node} el - the DOM node where to append the video frame.
   * @param {string} videoId - the youtube video id.
   * @returns {DOM node} returns the video player DOM node
   * @example
   * createYoutubeEmbed(document.body, "r4SsoTaOIKo"); // returns the videoContainer DOM node
   * @url: https://developers.google.com/youtube/iframe_api_reference
   */
  createYoutubeEmbed: function createYoutubeEmbed(el, videoId, autoplay) {

    var self = this;

    // 1. This code creates the video container and the video div with a random id.
    var videoContainer = self.createElement('div', "ModalLight-videoContainer", el);
    var videoDiv = self.createElement('div', "ModalLight-videoDiv", videoContainer);
    videoDiv.id = "ModalLightVideoId" + (Math.ceil(Math.random()*100)) + (Math.ceil(Math.random()*100));

    // 2. This code loads the IFrame Player API code asynchronously if not present.
    var scriptPresent = false;
    var allScriptTag = document.getElementsByTagName('script');
    forEachNode(allScriptTag, function(el, i) {
      if (el.src == "https://www.youtube.com/iframe_api") scriptPresent = true;
    })

    if (!scriptPresent) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = allScriptTag[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads only on the first click (scriptPresent = true).
    var player;

    // Creates the <iframe>
    function setPlayer() {
      player = new YT.Player(videoDiv.id, {
        videoId: videoId,
        events: {
          'onReady': onPlayerReady
        }
      });
      self.videoPlayer = player;
    }

    // Waits on the creation only the first time
    // After the scripts has downloaded
    if (!scriptPresent) {
      window.onYouTubeIframeAPIReady = function() {
        setPlayer();
      }
    // After the first time recreates the <iframe> on the run
    } else {
      setPlayer();
    }

    // 4. The API will call this function when the video player is ready.
    window.onPlayerReady = function(event) {
      if (typeof autoplay !== 'undefined' && autoplay === "true")
        event.target.playVideo();
    }

    return videoContainer;
 
  },

  /**
   * createVimeoEmbed creates a Vimeo video player with the Vimeo API.
   * @param {DOM node} el - the DOM node where to append the video frame.
   * @param {string} videoId - the youtube video id.
   * @returns {DOM node} returns the video player DOM node
   * @example
   * createVimeoEmbed(document.body, "r4SsoTaOIKo"); // returns the videoContainer DOM node
   * @url: https://developer.vimeo.com/player/js-api
   */
  createVimeoEmbed: function createVimeoEmbed(el, videoId, autoplay) {

    var self = this;

    var videoContainer = self.createElement('div', "ModalLight-videoContainer", el);
    var videoDiv = self.createElement('div', "ModalLight-videoDiv", videoContainer);
    var playerId = "ModalLightVideoId" + (Math.ceil(Math.random()*100)) + (Math.ceil(Math.random()*100));

    videoDiv.innerHTML = '<iframe id="'+playerId+'" src="https://player.vimeo.com/video/'+videoId+'?api=1&player_id='+playerId+'" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
    var player = videoDiv.querySelector('iframe');
    var playerOrigin = '*';

    // http://codepen.io/bdougherty/pen/FEuDd?editors=1010

    // Listen for messages from the player
    window.addEventListener('message', onMessageReceived, false);

    // Handle messages received from the player
    function onMessageReceived(event) {
        // Handle messages from the vimeo player only
        if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
            return false;
        }
        
        if (playerOrigin === '*') {
            playerOrigin = event.origin;
        }
        
        var data = JSON.parse(event.data);
        
        switch (data.event) {
            case 'ready':
                onReady();
                self.vimeoPlayer = {
                  destroy: function() {
                    post('pause');
                    window.removeEventListener('message', onMessageReceived);
                  }
                };
                break;
        }

    }

    // Helper function for sending a message to the player
    function post(action, value) {
        var data = {
          method: action
        };
        
        if (value) {
            data.value = value;
        }
        
        var message = JSON.stringify(data);
        player.contentWindow.postMessage(message, playerOrigin);
    }

    function onReady() {
        post('addEventListener', 'pause');
        post('addEventListener', 'finish');
        post('addEventListener', 'playProgress');
        if (typeof autoplay !== 'undefined' && autoplay === "true")
          post('play');
    }

    return videoContainer;

  },

  /**
   * isYoutubeVideo matches (and returns) the video Id 
   * of any valid Youtube Url, given as input string.
   * @param {string} url - any url string.
   * @returns {boolean} true if the url string is a youtube valid url
   * @example
   * isYoutubeVideo("https://www.youtube.com/watch?v=-hPes1uwnco"); // returns true
   * @author: Stephan Schmitz <eyecatchup@gmail.com>
   * @url: http://stackoverflow.com/a/10315969/624466
   */
  isYoutubeVideo: function isYoutubeVideo(url) {

    var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return (url.match(r)) ? RegExp.$1 : false;

  },

  /**
   * isVimeoVideo matches (and returns) the video Id 
   * of any valid Vimeo Url, given as input string.
   * @param {string} url - any url string.
   * @returns {boolean || id} the video id if the url string is a vimeo valid url
   * @example
   * isVimeoVideo("https://vimeo.com/cale/onward"); // returns 155624292
   * @author: l2aelba <http://stackoverflow.com/users/622813/l2aelba>
   * @url: http://stackoverflow.com/questions/13286785/get-video-id-from-vimeo-url/37695721#37695721
   */
  isVimeoVideo: function isvimeoVideo(url) {

    var r = /^(?:https?:\/\/|\/\/)?(?:www\.)?(?:vimeo\.com)/;

    if (!url.match(r))
      return false;

    var id = false;
    var request = new XMLHttpRequest();
    request.open('GET', 'https://vimeo.com/api/oembed.json?url='+url , false);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var response = JSON.parse(request.responseText);
        if(response.video_id) {
          id = response.video_id;
        }
      } else if (request.status >= 400) {
        console.log('Not a Vimeo Video.')
      }
    };
    request.send();
    return id;
  },

  destroy: function destroy() {

    var self = this;
    // Event Listeners removing
    forEachNode(self.triggers, function (el, i) {
      el.removeEventListener('click', self);
    });

  },

  // Init function
  init: function init(element) {

    var self = this;

    if (typeof element === 'undefined') {
      throw new Error('ModalLight - You must define a class selector!')
    }

    // The container string class
    self.triggerClass = element;

    // All the modal openers
    self.triggers = document.querySelectorAll('a'+ self.triggerClass);

    // If there are no openers silently exits the library
    if (!self.triggers.length) return;

    forEachNode(self.triggers, function (el, i) {
      el.addEventListener('click', self);
    });

    // Public exposed methods
    return {
      destroy: this.destroy.bind(this)
    }
  },

};

// The Plugin Function (init)
function modalLight(element, cstOptions) {

  var defaultOptions = {
    modalClass: '.ModalLight-modal'
  }
  var options = extend(defaultOptions, cstOptions);
  var o = Object.create(buildObj);
  o.options = options;

  return o.init(element);

};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( modalLight );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = modalLight;
} else {
  // browser global
  window.modalLight = modalLight;
}

})( window );