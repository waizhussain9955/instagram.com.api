<?php
/**
 * Plugin Name: Instagram Single Downloader
 * Description: Embed an Instagram single media downloader (reels, photos, videos) using shortcode [insta_single_downloader].
 * Version: 1.0.0
 * Author: InstaSave
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaSingleDownloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_single_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_insta_single_download', array($this, 'handle_ajax_download'));
        add_action('wp_ajax_nopriv_insta_single_download', array($this, 'handle_ajax_download'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta Single Downloader Settings',
            'Insta Single Downloader',
            'manage_options',
            'insta-single-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_single_settings_group', 'insta_api_url');
        register_setting('insta_single_settings_group', 'insta_api_key');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Instagram Single Downloader Configuration</h1>
            <form method="post" action="options.php">
                <?php settings_fields('insta_single_settings_group'); ?>
                <?php do_settings_sections('insta_single_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">InstaSave Backend API URL</th>
                        <td><input type="text" name="insta_api_url" value="<?php echo esc_attr(get_option('insta_api_url', 'http://localhost:8000')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">API Authentication Key</th>
                        <td><input type="password" name="insta_api_key" value="<?php echo esc_attr(get_option('insta_api_key')); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function render_shortcode() {
        ob_start();
        ?>
        <div class="insta-downloader-container">
            <h3 class="insta-title">Download Instagram Reel / Post</h3>
            <form id="insta-single-form" class="insta-form">
                <input type="url" id="insta-url" placeholder="Paste Instagram Link Here..." required class="insta-input" />
                <button type="submit" class="insta-submit-btn">Fetch Media</button>
            </form>
            <div id="insta-error" class="insta-error-box" style="display: none;"></div>
            <div id="insta-loader" class="insta-loader" style="display: none;">Processing...</div>
            <div id="insta-result" class="insta-result-box" style="display: none;"></div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-single-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '1.0.0');
        wp_enqueue_script('insta-single-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery'), '1.0.0', true);
        wp_localize_script('insta-single-script', 'insta_single_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_url'  => get_option('insta_api_url', 'http://localhost:8000')
        ));
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }
        
        wp_register_script(
            'insta-single-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element'),
            '1.0.0',
            true
        );

        register_block_type('insta-downloader/single', array(
            'editor_script' => 'insta-single-block-editor',
            'render_callback' => array($this, 'render_shortcode'),
        ));
    }

    public function handle_ajax_download() {
        $url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
        if (empty($url)) {
            wp_send_json_error(array('message' => 'Instagram URL is required.'));
        }

        $api_url = get_option('insta_api_url', 'http://localhost:8000') . '/api/v1/plugin/download/single';
        $api_key = get_option('insta_api_key');

        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key'    => $api_key
            ),
            'body' => json_encode(array('url' => $url)),
            'timeout' => 45
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'API connection failed: ' . $response->get_error_message()));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (wp_remote_retrieve_response_code($response) !== 200) {
            wp_send_json_error(array('message' => isset($data['error']) ? $data['error'] : 'Scraping failed.'));
        }

        wp_send_json_success($data);
    }
}

new InstaSingleDownloader();
