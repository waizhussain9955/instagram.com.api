(function(blocks, element) {
    var el = element.createElement;
    blocks.registerBlockType('insta-downloader/bulk', {
        title: 'Instagram Bulk Downloader',
        icon: 'grid-view',
        category: 'widgets',
        edit: function() {
            return el('div', { 
                style: { 
                    padding: '20px', 
                    border: '2px dashed #22c55e', 
                    borderRadius: '8px',
                    textAlign: 'center', 
                    background: '#f0fdf4',
                    color: '#22c55e',
                    fontWeight: 'bold',
                    fontSize: '15px'
                } 
            }, '📥 Instagram Bulk Downloader [insta_bulk_downloader]');
        },
        save: function() {
            return null; // Rendered dynamically in PHP
        },
    });
})(window.wp.blocks, window.wp.element);
