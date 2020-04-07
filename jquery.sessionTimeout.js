﻿/*jshint browser:true*/

//
// jquery.sessionTimeout.js
//
// After a set amount of time, a dialog is shown to the user with the option
// to either log out now, or stay connected. If log out now is selected,
// the page is redirected to a logout URL. If stay connected is selected,
// a keep-alive URL is requested through AJAX. If no options is selected
// after another set amount of time, the page is automatically redirected
// to a timeout URL.
//
//
// USAGE
//
//   1. Include jQuery
//   2. Include jQuery UI (for dialog)
//   3. Include jquery.sessionTimeout.js
//   4. Call $.sessionTimeout(); after document ready
//
//
// OPTIONS
//
//   message
//     Text shown to user in dialog after warning period.
//     Default: 'Your session is about to expire.'
//
//   keepAliveUrl
//     URL to call through AJAX to keep session alive. This resource should do something innocuous that would keep the session alive, which will depend on your server-side platform.
//     Default: '/keep-alive'
//
//   keepAliveAjaxRequestType
//     How should we make the call to the keep-alive url? (GET/POST/PUT)
//     Default: 'POST'
//
//   redirUrl
//     URL to take browser to if no action is take after warning period
//     Default: '/timed-out'
//
//   logoutUrl
//     URL to take browser to if user clicks "Log Out Now"
//     Default: '/log-out'
//
//   warnAfter
//     Time in milliseconds after page is opened until warning dialog is opened
//     Default: 900000 (15 minutes)
//
//   redirAfter
//     Time in milliseconds after page is opened until browser is redirected to redirUrl
//     Default: 1200000 (20 minutes)
//
//   appendTime
//     If true, appends the current time stamp to the Keep Alive url to prevent caching issues
//     Default: true
//
(function ($) {
    jQuery.sessionTimeout = function (options) {
        var defaults = {
            title: 'Session Timeout',
            textBtnLogoutNow: 'Log Out Now',
            textBtnStayConnected: 'Stay Connected',
            message: 'Your session is about to expire.',
            keepAliveUrl: '/keep-alive',
            keepAliveAjaxRequestType: 'POST',
            redirUrl: '/timed-out',
            logoutUrl: '/log-out',
            warnAfter: 900000, // 15 minutes
            redirAfter: 1200000, // 20 minutes
            appendTime: true // appends time stamp to keep alive url to prevent caching
        };

        // Extend user-set options over defaults
        var o = defaults,
                dialogTimer,
                redirTimer;

        if (options) { o = $.extend(defaults, options); }

        // Create timeout warning dialog
        $('body').append('<div title="' + o.title + '" id="sessionTimeout-dialog">' + o.message + '</div>');
        $('#sessionTimeout-dialog').dialog({
            autoOpen: false,
            width: 400,
            modal: true,
            closeOnEscape: false,
            open: function () { $(".ui-dialog-titlebar-close").hide(); },
            buttons: [
                {
                    text: o.textBtnLogoutNow,
                    click: function () {
                        window.location = o.logoutUrl;
                    },
                },
                {
                    text: o.textBtnStayConnected,
                    click: function () {
                        $(this).dialog('close');

                        $.ajax({
                            type: o.keepAliveAjaxRequestType,
                            url: o.appendTime ? updateQueryStringParameter(o.keepAliveUrl, "_", new Date().getTime()) : o.keepAliveUrl
                        });

                        // Stop redirect timer and restart warning timer
                        controlRedirTimer('stop');
                        controlDialogTimer('start');
                    },
                }
            ],
        });

        function controlDialogTimer(action) {
            switch (action) {
                case 'start':
                    // After warning period, show dialog and start redirect timer
                    dialogTimer = setTimeout(function () {
                        $('#sessionTimeout-dialog').dialog('open');
                        controlRedirTimer('start');
                    }, o.warnAfter);
                    break;

                case 'stop':
                    clearTimeout(dialogTimer);
                    break;
            }
        }

        function controlRedirTimer(action) {
            switch (action) {
                case 'start':
                    // Dialog has been shown, if no action taken during redir period, redirect
                    redirTimer = setTimeout(function () {
                        window.location = o.redirUrl;
                    }, o.redirAfter - o.warnAfter);
                    break;

                case 'stop':
                    clearTimeout(redirTimer);
                    break;
            }
        }

        // Courtesy of http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
        // Includes fix for angular ui-router as per comment by j_walker_dev
        function updateQueryStringParameter(uri, key, value) {
            var re = new RegExp("([?|&])" + key + "=.*?(&|#|$)", "i");

            if (uri.match(re)) {
                return uri.replace(re, '$1' + key + "=" + value + '$2');
            } else {
                var hash = '';

                if (uri.indexOf('#') !== -1) {
                    hash = uri.replace(/.*#/, '#');
                    uri = uri.replace(/#.*/, '');
                }

                var separator = uri.indexOf('?') !== -1 ? "&" : "?";
                return uri + separator + key + "=" + value + hash;
            }
        }

        $(document).ajaxComplete(function () {
            if (!$('#sessionTimeout-dialog').dialog("isOpen")) {
                controlRedirTimer('stop');
                controlDialogTimer('stop');
                controlDialogTimer('start');
            }
        });

        // Begin warning period
        controlDialogTimer('start');
    };
})(jQuery);
