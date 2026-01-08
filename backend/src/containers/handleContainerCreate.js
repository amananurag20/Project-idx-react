import Docker from 'dockerode';
// import path from 'path';
const docker = new Docker();

export const listContainer = async () => {

    const containers = await docker.listContainers();
    console.log("Containers", containers);
    // PRINT PORTS ARRAY FROM ALL CONTAINER
    containers.forEach((containerInfo) => {
        console.log(containerInfo.Ports);
    })
}

export const handleContainerCreate = async (projectId, terminalSocket, req, tcpSocket, head) => {
    console.log("Project id received for container create", projectId);
    try {

        // Delete any existing container (running OR stopped) with same name
        // Using 'all: true' to include stopped containers
        const existingContainers = await docker.listContainers({
            all: true,
            filters: { name: [projectId] }
        });

        console.log("Existing containers found:", existingContainers.length);

        // Remove all containers with this name
        for (const containerInfo of existingContainers) {
            // Check if the container name matches exactly (Docker adds a leading /)
            const names = containerInfo.Names || [];
            const exactMatch = names.some(name => name === `/${projectId}` || name === projectId);

            if (exactMatch) {
                console.log("Container already exists, stopping and removing it:", containerInfo.Id);
                try {
                    const container = docker.getContainer(containerInfo.Id);
                    await container.remove({ force: true });
                    console.log("Removed existing container");
                } catch (removeError) {
                    console.log("Error removing container:", removeError.message);
                }
            }
        }

        console.log("Creating a new container");

        const container = await docker.createContainer({
            Image: 'sandbox', // name given by us for the written dockerfile
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ['/bin/bash'],
            name: projectId,
            Tty: true,
            User: "sandbox",
            Volumes: {
                "/home/sandbox/app": {}
            },
            ExposedPorts: {
                "5173/tcp": {}
            },
            Env: ["HOST=0.0.0.0"],
            HostConfig: {
                Binds: [ // mounting the project directory to the container
                    `${process.cwd()}/projects/${projectId}:/home/sandbox/app`
                ],
                PortBindings: {
                    "5173/tcp": [
                        {
                            "HostPort": "0" // random port will be assigned by docker
                        }
                    ]
                },

            }
        });

        console.log("Container created", container.id);

        await container.start();

        console.log("container started");

        // Below is the place where we upgrade the connection to websocket
        // terminalSocket.handleUpgrade(req, tcpSocket, head, (establishedWSConn) => {
        //     console.log("Connection upgraded to websocket");
        //     terminalSocket.emit("connection", establishedWSConn, req, container);
        // });

        return container;



    } catch (error) {
        console.log("Failed to create container", error);
        return null;
    }


}


export async function getContainerPort(containerName) {
    const container = await docker.listContainers({
        name: containerName
    });

    if (container.length > 0) {
        const containerInfo = await docker.getContainer(container[0].Id).inspect();
        console.log("Container info", containerInfo);
        try {
            return containerInfo?.NetworkSettings?.Ports["5173/tcp"][0].HostPort;
        } catch (error) {
            console.log("port not present");
            return undefined;
        }

    }
}