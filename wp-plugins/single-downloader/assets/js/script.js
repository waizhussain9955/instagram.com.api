jQuery(document).ready(function($) {
    $('#insta-single-form').on('submit', function(e) {
        e.preventDefault();
        
        var url = $('#insta-url').val();
        if (!url) return;

        $('#insta-error').hide();
        $('#insta-result').hide();
        $('#insta-loader').show();

        $.ajax({
            url: insta_single_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'insta_single_download',
                url: url
            },
            success: function(response) {
                $('#insta-loader').hide();
                if (response.success) {
                    var data = response.data;
                    var html = '<strong>Posted by: @' + data.owner + '</strong>';
                    html += '<div class="insta-media-grid">';
                    
                    data.media.forEach(function(item) {
                        html += '<div class="insta-media-card">';
                        html += '<div class="insta-media-preview">';
                        if (item.type === 'video') {
                            html += '<video controls><source src="' + item.url + '" type="video/mp4"></video>';
                        } else {
                            html += '<img src="' + item.url + '" alt="Instagram post">';
                        }
                        html += '</div>';
                        // Proxy download url
                        var proxyUrl = get_api_base_url() + '/api/v1/download/proxy?url=' + encodeURIComponent(item.url);
                        html += '<a href="' + proxyUrl + '" class="insta-dl-btn" download>Download Media</a>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    $('#insta-result').html(html).show();
                } else {
                    $('#insta-error').text(response.data.message || 'An error occurred.').show();
                }
            },
            error: function() {
                $('#insta-loader').hide();
                $('#insta-error').text('Could not communicate with the WordPress server.').show();
            }
        });
    });

    function get_api_base_url() {
        return insta_single_ajax.api_url || 'http://localhost:8000';
    }
});
