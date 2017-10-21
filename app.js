var app = angular.module("authChatApp", ["firebase"]);

app.controller("authChatCtrl", function ($scope, $firebaseArray) {

  // Firebase
  var ref = new Firebase("https://webguide.firebaseio.com/");

  // ==================================================================================================================================================================================
  // ===================================================================================== Messages =====================================================================================
  // ==================================================================================================================================================================================

  $scope.n = 8;

  $scope.initMessages = function () {
    if (ref.getAuth()) {
      $scope.messages = $firebaseArray(ref.child("authChat").child("messages").limitToLast($scope.n));
    } else if (typeof $scope.messages !== "undefined") {
      $scope.messages.$destroy();
    }
  };

  // add new items to the array
  // the message is automatically added to our Firebase database!
  $scope.addMessage = function (hash) {
    var imageHash = null;
    if (typeof hash !== "undefined") {
      imageHash = hash;
    }
    var text = null;
    if (typeof $scope.newMessageText !== "undefined") {
      text = $scope.newMessageText;
    }
    $scope.messages.$add({
      uid: ref.getAuth().uid,
      user: ref.getAuth().google.displayName,
      cachedUserProfile: ref.getAuth().google.cachedUserProfile,
      text: text,
      imageHash: imageHash
    });
    $scope.newMessageText = "";
    $("html, body").animate({
      scrollTop: $(document).height()
    }, 1080);
  };

  $scope.viewMoreMessages = function () {
    $scope.n += 5;
    $scope.initMessages();
  };

  $scope.resetMessagesView = function () {
    $scope.n = 10;
    $scope.initMessages();
  };

  // ==================================================================================================================================================================================
  // =================================================================================== File Upload ==================================================================================
  // ==================================================================================================================================================================================

  $scope.initFileUpload = function () {
    document.getElementById("file-upload").addEventListener('change', uploadImage, false);
  };

  $scope.viewImageModal = function (hash) {
    $scope.fetchImagePayload(hash.toString(), function (payload) {
      $('#myModal img').attr("src", payload);
      $('#myModal').modal({});
    });
  };

  $scope.fetchImagePayload = function (hash, callback) {
    if (typeof hash !== "undefined") {
      // A hash was passed in, so let's retrieve and render it.
      var f = new Firebase("https://webguide.firebaseio.com/images/" + hash + "/filePayload");
      f.once('value', function (snap) {
        var payload = snap.val();
        if (payload != null) {
          callback(payload);
        } else {
          errmsg("Imagem não encontrada.");
        }
      });
    }
  };

  function uploadImage(evt) {
    var f = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = (function (theFile) {
      return function (e) {
        var filePayload = e.target.result;
        // Generate a location that can't be guessed using the file's contents and a random number
        var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(filePayload));
        var f = new Firebase("https://webguide.firebaseio.com/images/" + hash + "/filePayload");
        beginl();
        // Set the file payload to Firebase and register an onComplete handler to stop the spinner and show the preview
        f.set(filePayload, function () {
          endl();
          $("#file-upload").val(null);
          $scope.addMessage(hash.toString());
        });
      };
    })(f);
    reader.readAsDataURL(f);
  }

  $scope.downloadImages = function (hash) {
    if (typeof hash !== "undefined") {
      $scope.fetchImagePayload(hash.toString(), function (payload) {
        $(".image-" + hash + " img").attr("src", payload);
        $(".image-" + hash + " a").attr("href", payload);
      });
    }
  };

  $scope.containsImage = function (message) {
    return typeof message.imageHash === 'string';
  };

  // ==================================================================================================================================================================================
  // ====================================================================================== Auth ======================================================================================
  // ==================================================================================================================================================================================

  $scope.googleLogin = function () {

    ref.authWithOAuthPopup("google", function (popupError) {
      if (popupError) {
        errmsg("Login Failed!" + redirectError);
      } else {
        $scope.loadUserInfo();
        $scope.initMessages();
        $scope.$apply();
      }
    });
  };

  $scope.logout = function () {
    ref.unauth();
    $scope.loadUserInfo();
    $scope.initMessages();
    //$scope.$apply();
  };

  $scope.isAuth = function () {
    return ref.getAuth() != null;
  };

  $scope.loadUserInfo = function () {
    if (ref.getAuth()) {
      $("#userInfo #profileImage").attr("src", ref.getAuth().google.profileImageURL);
      $("#userInfo #displayName").text(ref.getAuth().google.displayName);
    } else {
      $("#userInfo #profileImage").removeAttr("src");
      $("#userInfo #displayName").text("");
    }
  };

  // ==================================================================================================================================================================================
  // ====================================================================================== Init ======================================================================================
  // ==================================================================================================================================================================================

  $scope.loadUserInfo();
  $scope.initMessages();
  $scope.initFileUpload();

});

// ====================================================================================================================================================================================
// ======================================================================================= Public =====================================================================================
// ====================================================================================================================================================================================

function scsmsg(msg) {
  $(".alert-success").show();
  $(".alert-success .message-content").append(msg + "<br>");
}

function infmsg(msg) {
  $(".alert-info").show();
  $(".alert-info .message-content").append(msg + "<br>");
}

function wrnmsg(msg) {
  $(".alert-warning").show();
  $(".alert-warning .message-content").append(msg + "<br>");
}

function errmsg(msg) {
  $(".alert-danger").show();
  $(".alert-danger .message-content").append(msg + "<br>");
}

function jsnmsg(json) {
  $(".json-content").show();
  $(".json-content").append(JSON.stringify(json, null, 2) + "\n");
}

function beginl() {
  $("#mainAjaxLoader").show();
}

function endl() {
  $("#mainAjaxLoader").hide();
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    $("#userLocation").html("Geolocation is not supported by this browser.");
  }
}

function showPosition(position) {
  $("#userLocation").html("Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude);
  var pos = [position.coords.latitude, position.coords.longitude];
  console.log(pos);
  console.log(geoFire.set("current", pos));
}