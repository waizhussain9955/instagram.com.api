(function(blocks, element) {
    var el = element.createElement;
    blocks.registerBlockType('insta-downloader/single', {
        title: 'Instagram Single Downloader',
        icon: 'download',
        category: 'widgets',
        edit: function() {
            return el('div', { 
                style: { 
                    padding: '20px', 
                    border: '2px dashed #9333ea', 
                    borderRadius: '8px',
                    textAlign: 'center', 
                    background: '#faf5ff',
                    color: '#9333ea',
                    fontWeight: 'bold',
                    fontSize: '15px'
                } 
            }, '📥 Instagram Single Downloader [insta_single_downloader]');
        },
        save: function() {
            return null; // Rendered dynamically in PHP
        },
    });
})(window.wp.blocks, window.wp.element);
