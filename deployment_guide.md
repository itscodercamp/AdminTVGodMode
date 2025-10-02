
# Docker Deployment Guide for Trusted Vehicles App

This guide provides the exact commands and steps needed to build and run your Next.js application using the provided Dockerfile. This setup ensures that your database and uploaded images are persistent (not deleted when the app restarts) and solves file permission issues in production.

---

### Prerequisites

1.  **Docker Installed:** Make sure Docker is installed on your production server (e.g., your Hostinger VPS).
2.  **Project Code:** Your project code should be on the server.

---

### Step 1: Build the Docker Image

Navigate to your project's root directory (the folder containing the `Dockerfile`) in the terminal and run this command.

-   `-t` gives your image a name (tag). We will use `trusted-vehicles-app`.
-   `.` tells Docker to look for the Dockerfile in the current directory.

```bash
docker build -t trusted-vehicles-app:latest .
```

This command will take a few minutes to run. It creates a ready-to-use template of your application called `trusted-vehicles-app`.

---

### Step 2: Prepare Host Directories for Persistent Data

Before running the app, we need to create a place on the server (the "host") where the database and images will be permanently stored.

**1. Create a folder for your application's persistent data:**
```bash
mkdir -p /opt/trusted-vehicles-data/public
```
*   This creates a main folder `/opt/trusted-vehicles-data`.
*   Inside it, it creates a `public` folder which will store your uploaded images.

**2. Create an empty database file:**
Your Docker image already has a `dev.db` file inside it. But for data to be persistent, we need the *real* database file to be on the host. If you're starting fresh on the server, create an empty one.
```bash
touch /opt/trusted-vehicles-data/dev.db
```

**3. Set the Correct Permissions:**
This is the most important step to solve the production error. We need to find out which user your server uses for web processes and give it ownership of these folders.
   *   Common user names are `www-data`, `nginx`, or `nobody`.
   *   Run `ps aux | grep 'node|next'` to find the user if you are unsure. Let's assume it's `www-data`.

```bash
sudo chown -R www-data:www-data /opt/trusted-vehicles-data
```
This command gives the `www-data` user full permission to write to the database and save images in these folders.

---

### Step 3: Run the Docker Container

Now, use the following **real, complete command** to start your application.

*   `-d`: Runs the app in the background (detached mode).
*   `-p 3000:3000`: Connects your server's port 3000 to the container's port 3000.
*   `-v`: This is the volume mapping. It connects the folders you created on the server to the folders inside the container.
    *   `/opt/trusted-vehicles-data/dev.db` on your server maps to `/dev.db` inside the container.
    *   `/opt/trusted-vehicles-data/public` on your server maps to `/public` inside the container.
*   `--name trusted-vehicles-live`: Gives your running container a simple name to manage it easily.
*   `--restart always`: This is very useful. It automatically restarts your app if the server reboots or if the app crashes for some reason.
*   `trusted-vehicles-app:latest`: The name of the image you built in Step 1.

```bash
docker run -d \
  -p 3000:3000 \
  -v /opt/trusted-vehicles-data/dev.db:/dev.db \
  -v /opt/trusted-vehicles-data/public:/public \
  --name trusted-vehicles-live \
  --restart always \
  trusted-vehicles-app:latest
```

**Your application is now live!** You should be able to access it at `http://<your_server_ip>:3000`.

---

### Step 4: Managing Your Live App

Here are some useful commands to manage your running container:

*   **View Logs:** To see what your app is doing or check for errors.
    ```bash
    docker logs -f trusted-vehicles-live
    ```

*   **Stop the App:**
    ```bash
    docker stop trusted-vehicles-live
    ```

*   **Start the App Again:**
    ```bash
    docker start trusted-vehicles-live
    ```

*   **Remove the Container (to run a new version):**
    First stop it, then remove it.
    ```bash
    docker stop trusted-vehicles-live
    docker rm trusted-vehicles-live
    ```
    After this, you can repeat Step 3 to run a new container (for example, after you've built an updated image).

