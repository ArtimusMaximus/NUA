const server = 'http://localhost:4321'



export const handleCommand1 = async () => {

    const response = await fetch(`${server}/api/bashls`);

    try {
        if (response.ok) {
            console.log('got ya')
        }
    } catch(err) {
        console.error(err);
    }

    return response;
}

export const handleCommand2 = async () => {

    const response = await fetch(`${server}/api/sites`);

    try {
        if (response.ok) {
            console.log(response.json());
        }
    } catch(err) {
        console.error(err);
    }

    return response;
}