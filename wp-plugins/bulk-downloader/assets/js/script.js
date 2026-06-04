jQuery(document).ready(function($) {
    var posts = [];
    var selected = [];
    var username = '';

    $('#insta-bulk-form').on('submit', function(e) {
        e.preventDefault();
        
        username = $('#insta-username').val().trim();
        var limit = $('#insta-limit').val();
        if (!username) return;

        $('#insta-bulk-error').hide();
        $('#insta-bulk-content').hide();
        $('#insta-bulk-loader').show();
        posts = [];
        selected = [];

        $.ajax({
            url: insta_bulk_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'insta_bulk_fetch',
                username: username,
                limit: limit
            },
            success: function(response) {
                $('#insta-bulk-loader').hide();
                if (response.success && response.data.posts) {
                    posts = response.data.posts;
                    renderGrid();
                    $('#insta-bulk-content').show();
                } else {
                    $('#insta-bulk-error').text(response.data.message || 'Failed to harvest profile.').show();
                }
            },
            error: function() {
                $('#insta-bulk-loader').hide();
                $('#insta-bulk-error').text('Could not communicate with WordPress server.').show();
            }
        });
    });

    function renderGrid() {
        var gridHtml = '';
        posts.forEach(function(post) {
            var isSel = selected.includes(post.id);
            var activeClass = isSel ? 'selected' : '';
            var previewUrl = get_api_base_url() + '/api/v1/download/proxy?url=' + encodeURIComponent(post.preview);
            gridHtml += '<div class="insta-grid-item ' + activeClass + '" data-id="' + post.id + '">';
            gridHtml += '<img src="' + previewUrl + '" alt="Insta Post">';
            gridHtml += '<div class="insta-checkbox-marker"></div>';
            gridHtml += '</div>';
        });
        $('#insta-bulk-grid').html(gridHtml);
        updateSelectionCounter();
    }

    $(document).on('click', '.insta-grid-item', function() {
        var id = $(this).data('id');
        if (selected.includes(id)) {
            selected = selected.filter(function(item) { return item !== id; });
        } else {
            selected.push(id);
        }
        $(this).toggleClass('selected');
        updateSelectionCounter();
    });

    $('#insta-select-all').on('click', function(e) {
        e.preventDefault();
        selected = posts.map(function(p) { return p.id; });
        $('.insta-grid-item').addClass('selected');
        updateSelectionCounter();
    });

    $('#insta-deselect-all').on('click', function(e) {
        e.preventDefault();
        selected = [];
        $('.insta-grid-item').removeClass('selected');
        updateSelectionCounter();
    });

    function updateSelectionCounter() {
        $('#insta-sel-count').text(selected.length);
        $('#insta-download-selected').prop('disabled', selected.length === 0);
    }

    $('#insta-download-selected').on('click', function(e) {
        e.preventDefault();
        if (selected.length === 0) return;

        $('#insta-bulk-error').hide();
        $('#insta-bulk-loader').text('Generating ZIP packages...').show();

        var selectedMedia = posts.filter(function(p) {
            return selected.includes(p.id);
        }).map(function(p) {
            return { id: p.id, url: p.url, type: p.type };
        });

        $.ajax({
            url: insta_bulk_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'insta_bulk_zip',
                username: username,
                media: selectedMedia
            },
            success: function(response) {
                $('#insta-bulk-loader').hide();
                if (response.success && response.data.zip_url) {
                    window.location.href = response.data.zip_url;
                } else {
                    $('#insta-bulk-error').text('Failed to compile ZIP file.').show();
                }
            },
            error: function() {
                $('#insta-bulk-loader').hide();
                $('#insta-bulk-error').text('AJAX compilation request error.').show();
            }
        });
    });

    function get_api_base_url() {
        return insta_bulk_ajax.api_url || 'http://localhost:8000';
    }
});
