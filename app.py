from flask import Flask
import os

app = Flask(__name__)

# Configure static and template folders
app.static_folder = os.path.join('static')
app.template_folder = os.path.join('templates')

from router import configure_routes
configure_routes(app)

if __name__ == '__main__':
    app.run(debug=True)