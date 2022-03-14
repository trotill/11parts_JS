

function Build() {

    return [
        {
            name: 'Master volume',
            type: 'tfield',
            id: 'alsaMasterVol',
            value: 10
        },
        {
            name: 'PCM volume',
            type: 'tfield',
            id: 'alsaPcmVol',
            value: 10
        }
    ]
}

module.exports = {
    Build:Build
}