"""Create, upload and set the workshop's three-area LINE Rich Menu."""
import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from linebot.v3.messaging import (
    ApiClient, Configuration, CreateRichMenuAliasRequest, MessagingApi,
    MessagingApiBlob, RichMenuArea, RichMenuBounds, RichMenuRequest,
    RichMenuSize, MessageAction,
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path, help="PNG/JPEG 2500x1686")
    args = parser.parse_args()
    load_dotenv()
    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
    if not token:
        raise SystemExit("LINE_CHANNEL_ACCESS_TOKEN is required")
    if not args.image.exists():
        raise SystemExit(f"Image not found: {args.image}")

    menu = RichMenuRequest(
        size=RichMenuSize(width=2500, height=1686), selected=True,
        name="HealthLine AI Workshop", chat_bar_text="เมนูสุขภาพ",
        areas=[
            RichMenuArea(bounds=RichMenuBounds(x=0, y=0, width=834, height=1686), action=MessageAction(label="FAQ", text="faq")),
            RichMenuArea(bounds=RichMenuBounds(x=834, y=0, width=833, height=1686), action=MessageAction(label="สถิติ", text="สถิติ")),
            RichMenuArea(bounds=RichMenuBounds(x=1667, y=0, width=833, height=1686), action=MessageAction(label="ช่วยเหลือ", text="ช่วยเหลือ")),
        ],
    )
    config = Configuration(access_token=token)
    with ApiClient(config) as client:
        api = MessagingApi(client)
        rich_menu_id = api.create_rich_menu(rich_menu_request=menu).rich_menu_id
        blob = MessagingApiBlob(client)
        content_type = "image/png" if args.image.suffix.lower() == ".png" else "image/jpeg"
        blob.set_rich_menu_image(rich_menu_id, body=args.image.read_bytes(), _headers={"Content-Type": content_type})
        api.set_default_rich_menu(rich_menu_id)
    print(f"Rich Menu ready: {rich_menu_id}")


if __name__ == "__main__":
    main()
