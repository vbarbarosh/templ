window.apis = {
    files_all: async function () {
        return `
https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_30MB.mp4
https://samplelib.com/lib/preview/mp4/sample-20s.mp4
https://thetestdata.com/assets/video/mp4/highquality/4k_Thetestdata.mp4
https://thetestdata.com/assets/video/mp4/720/10MB_720P_THETESTDATA.COM_mp4.mp4
        `.trim().split('\n');
    },
    doc_get: async function () {
        return http_get_json('http://127.0.0.1:3000/demo.json');
    },
    doc_put: async function (doc) {
        await http_put_json('http://127.0.0.1:3000/demo.json', doc);
    },
};
