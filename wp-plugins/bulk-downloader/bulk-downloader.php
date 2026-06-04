<?php
/**
 * Plugin Name: Instagram Bulk Downloader
 * Description: Embed an Instagram bulk profile media downloader using shortcode [insta_bulk_downloader].
 * Version: 1.0.0
 * Author: InstaSave
 */

if (!defined('ABSPATH')) {
    exit;
}

class InstaBulkDownloader {
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_shortcode('insta_bulk_downloader', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('wp_ajax_insta_bulk_fetch', array($this, 'handle_ajax_fetch'));
        add_action('wp_ajax_nopriv_insta_bulk_fetch', array($this, 'handle_ajax_fetch'));
        add_action('wp_ajax_insta_bulk_zip', array($this, 'handle_ajax_zip'));
        add_action('wp_ajax_nopriv_insta_bulk_zip', array($this, 'handle_ajax_zip'));
        add_action('init', array($this, 'register_gutenberg_block'));
    }

    public function add_settings_page() {
        add_options_page(
            'Insta Bulk Downloader Settings',
            'Insta Bulk Downloader',
            'manage_options',
            'insta-bulk-downloader',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('insta_bulk_settings_group', 'insta_bulk_api_url');
        register_setting('insta_bulk_settings_group', 'insta_bulk_api_key');
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Instagram Bulk Downloader Configuration</h1>
            <form method="post" action="options.php">
                <?php settings_fields('insta_bulk_settings_group'); ?>
                <?php do_settings_sections('insta_bulk_settings_group'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">InstaSave Backend API URL</th>
                        <td><input type="text" name="insta_bulk_api_url" value="<?php echo esc_attr(get_option('insta_bulk_api_url', 'http://localhost:8000')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">API Authentication Key</th>
                        <td><input type="password" name="insta_bulk_api_key" value="<?php echo esc_attr(get_option('insta_bulk_api_key')); ?>" class="regular-text" /></td>
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
            <h3 class="insta-title">Bulk Profile Downloader</h3>
            <form id="insta-bulk-form" class="insta-form-grid">
                <input type="text" id="insta-username" placeholder="Username (e.g. cristiano)" required class="insta-input" />
                <select id="insta-limit" class="insta-select">
                    <option value="10">10 Posts</option>
                    <option value="20">20 Posts</option>
                    <option value="50">50 Posts</option>
                </select>
                <button type="submit" class="insta-submit-btn">Fetch Profile</button>
            </form>
            <div id="insta-bulk-error" class="insta-error-box" style="display: none;"></div>
            <div id="insta-bulk-loader" class="insta-loader" style="display: none;">Scanning profile nodes...</div>
            
            <div id="insta-bulk-content" style="display: none;">
                <div class="insta-actions-bar">
                    <div>
                        <button id="insta-select-all" class="insta-btn-alt">Select All</button>
                        <button id="insta-deselect-all" class="insta-btn-alt">Deselect All</button>
                    </div>
                    <button id="insta-download-selected" class="insta-submit-btn">Download Selected (<span id="insta-sel-count">0</span>)</button>
                </div>
                <div id="insta-bulk-grid" class="insta-grid-display"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function enqueue_assets() {
        wp_enqueue_style('insta-bulk-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '1.0.0');
        wp_enqueue_script('insta-bulk-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array('jquery'), '1.0.0', true);
        wp_localize_script('insta-bulk-script', 'insta_bulk_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'api_url'  => get_option('insta_bulk_api_url', 'http://localhost:8000')
        ));
    }

    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }
        
        wp_register_script(
            'insta-bulk-block-editor',
            plugin_dir_url(__FILE__) . 'assets/js/block.js',
            array('wp-blocks', 'wp-element'),
            '1.0.0',
            true
        );

        register_block_type('insta-downloader/bulk', array(
            'editor_script' => 'insta-bulk-block-editor',
            'render_callback' => array($this, 'render_shortcode'),
        ));
    }

    public function handle_ajax_fetch() {
        $username = isset($_POST['username']) ? sanitize_text_field($_POST['username']) : '';
        $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 10;

        if (empty($username)) {
            wp_send_json_error(array('message' => 'Username is required.'));
        }

        $api_url = get_option('insta_bulk_api_url', 'http://localhost:8000') . '/api/v1/plugin/download/bulk-fetch';
        $api_key = get_option('insta_bulk_api_key');

        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key'    => $api_key
            ),
            'body' => json_encode(array('username' => $username, 'limit' => $limit)),
            'timeout' => 45
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Scraper connection failed.'));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        wp_send_json_success($data);
    }

    public function handle_ajax_zip() {
        $username = isset($_POST['username']) ? sanitize_text_field($_POST['username']) : '';
        $media = isset($_POST['media']) ? $_POST['media'] : array();

        if (empty($username) || empty($media)) {
            wp_send_json_error(array('message' => 'Invalid data.'));
        }

        $api_url = get_option('insta_bulk_api_url', 'http://localhost:8000') . '/api/v1/plugin/download/zip';
        $api_key = get_option('insta_bulk_api_key');

        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key'    => $api_key
            ),
            'body' => json_encode(array('username' => $username, 'media' => $media)),
            'timeout' => 60
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'ZIP compilation failed.'));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        wp_send_json_success($data);
    }
}

new InstaBulkDownloader();
