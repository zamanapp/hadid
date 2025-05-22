from setuptools import setup, find_packages
from setuptools.command.install import install
import subprocess
import sys


class InstallSystemDependencies(install):
    def run(self):
        try:
            subprocess.check_call(
                [sys.executable, "-m", "py_hadid.scripts.pre_install"]
            )
        except subprocess.CalledProcessError as e:
            print(f"Pre-install script failed: {e}", file=sys.stderr)
            sys.exit(1)
        install.run(self)


setup(
    name="py-hadid",
    cmdclass={
        "install": InstallSystemDependencies,
    },
    version="0.0.7",
    packages=find_packages(where="py_hadid"),  # Specify the root folder
    package_dir={"": "py_hadid"},  # Map root directory
    include_package_data=True,
)
