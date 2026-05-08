# utils/html_helpers.py
import time, random, logging
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

def can_fetch(base_url: str, path: str, ua: str = "PropiqScraper/1.0") -> bool:
    """Return True if the site’s robots.txt allows the given path."""
    rp = RobotFileParser()
    robots_url = urljoin(base_url, "/robots.txt")
    try:
        rp.set_url(robots_url)
        rp.read()
    except Exception as e:
        log.warning(f"Unable to read robots.txt at {robots_url}: {e}")
        return True          # fail-open – assume allowed if we can’t read it
    return rp.can_fetch(ua, path)

def fetch(url: str, *, headers: dict = None, timeout: int = 12,
          pause: float = 1.5) -> requests.Response:
    """GET `url` with a standard header and a polite pause."""
    hdr = {
        "User-Agent": "PropiqScraper/1.0 (+https://github.com/your-org/propiq)",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if headers:
        hdr.update(headers)

    resp = requests.get(url, headers=hdr, timeout=timeout)
    resp.raise_for_status()
    time.sleep(pause + random.uniform(0, 0.5))   # jitter
    return resp

def soup_from_response(resp: requests.Response) -> BeautifulSoup:
    """Convenient wrapper that returns a lxml-parsed soup."""
    return BeautifulSoup(resp.text, "lxml")

def text_or_none(tag):
    return tag.get_text(strip=True) if tag else None
