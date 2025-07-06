function urlnorm(url)
{
    return url.match(/^\w+:/) ? url : `http://${url}`;
}

module.exports = urlnorm;
