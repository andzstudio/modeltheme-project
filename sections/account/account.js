$(document).ready(function() {
    const $authOverlay = $('#mt-authOverlay');
    const $authContainer = $('#mt-authContainer');
    const $openBtn = $('#mt-open-account-btn');
    const $backBtns = $('.mt-auth-back-button');

    const $signUpBtn = $('#mt-signUpBtn');
    const $signInBtn = $('#mt-signInBtn');
    const $mobileSignUpBtn = $('#mt-mobileSignUpBtn');
    const $mobileSignInBtn = $('#mt-mobileSignInBtn');

    const $forgotPasswordLink = $('.mt-auth-forgot-password');
    const $backToLoginLink = $('#mt-backToLoginLink');

    function openOverlay() {
        $authOverlay.addClass('active');
        $('body').addClass('mt-auth-overlay-open');
    }

    function closeOverlay() {
        $authOverlay.removeClass('active right-panel-active forgot-password-active');
        $('body').removeClass('mt-auth-overlay-open');
    }

    $openBtn.on('click', function(e) {
        e.preventDefault();
        openOverlay();
    });

    $backBtns.on('click', closeOverlay);

    $authOverlay.on('click', function(e) {
        if ($(e.target).is($authOverlay)) {
            closeOverlay();
        }
    });

    $signUpBtn.on('click', function() {
        $authContainer.addClass('right-panel-active');
    });

    $signInBtn.on('click', function() {
        $authContainer.removeClass('right-panel-active');
    });

    $mobileSignUpBtn.on('click', function() {
        $authContainer.addClass('right-panel-active');
    });

    $mobileSignInBtn.on('click', function() {
        $authContainer.removeClass('right-panel-active');
    });

    $forgotPasswordLink.on('click', function(e) {
        e.preventDefault();
        $authContainer.addClass('forgot-password-active');
    });

    $backToLoginLink.on('click', function(e) {
        e.preventDefault();
        $authContainer.removeClass('forgot-password-active');
    });

    $('.mt-auth-password-toggle').on('click', function() {
        const $input = $(this).prev('input');
        const type = $input.attr('type') === 'password' ? 'text' : 'password';
        $input.attr('type', type);
        $(this).toggleClass('active');
    });

    function showAuthNotification(message, type = 'error') {
        const $container = $('#mt-auth-notification-container');
        if (!$container.length) return;

        const iconHtml = type === 'success' ?
            '<div class="mt-notif-check">✓</div>' :
            '<div class="mt-notif-error-icon">!</div>';

        const $notif = $(`
            <div class="mt-ios-notification ${type}">
                <img class="mt-notif-icon" src="img/logo.png" alt="Icon">
                <div class="mt-notif-content">
                    <span class="mt-notif-title">ModelTheme</span>
                    <span class="mt-notif-msg">${message}</span>
                </div>
                ${iconHtml}
            </div>
        `);

        $container.append($notif);

        $notif.hide().fadeIn(300).delay(3000).fadeOut(400, function() {
            $(this).remove();
        });
    }
});