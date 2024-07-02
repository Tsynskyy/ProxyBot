# ping.py

from telegram import Update
from telegram.ext import (
    ConversationHandler,
    CallbackContext
)
import subprocess
import concurrent
import re
from utils import empty_file
import os
import globals
import sys

from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
sys.path.append(parent_dir)

ip_list_path = "Ping\\ip_list.txt"
reachable_path = "Ping\\reachable.txt"
unreachable_path = "Ping\\unreachable.txt"

WAITING_FOR_INPUT_PING = 1


async def start_ping(update: Update, context: CallbackContext):
    print(globals.is_command_running)

    if globals.is_command_running:
        await update.message.reply_text(
            "Another command is currently running. Please wait.")
        return

    globals.is_command_running = True

    print(globals.is_command_running)

    await update.message.reply_text("Список серверов можно отправить текстом или txt файлом")
    return WAITING_FOR_INPUT_PING


async def ping(update: Update, context: CallbackContext):
    if update.message.text:
        print("Пользователь отправил список серверов текстом")

        user_input = update.message.text
        with open(ip_list_path, 'w', encoding='utf-8') as file:
            file.write(user_input)
    elif update.message.document:
        print("Пользователь отправил список серверов файлом")

        file_id = update.message.document.file_id
        new_file = await context.bot.get_file(file_id)
        await new_file.download_to_drive(custom_path=ip_list_path)
    else:
        print("Пользователь отправил не текст или файл")

        globals.is_command_running = False

        await start_ping(update, context)

    Valid_list = ip_valid(ip_list_path)

    if not Valid_list:
        await update.message.reply_text("Сообщение не содержит серверов или имеет неверный формат")

        globals.is_command_running = False
        await start_ping(update, context)
    else:
        await update.message.reply_text("Список принят, пингую сервера")

        ping_ip()

        if not empty_file(reachable_path):
            await update.message.reply_text("Список доступных серверов:")

            with open(reachable_path, 'r') as file:
                file_content = file.read()
                await context.bot.send_message(chat_id=update.effective_chat.id, text=file_content)

        if not empty_file(unreachable_path):
            await update.message.reply_text("Список недоступных серверов:")

            with open(unreachable_path, 'r') as file:
                file_content = file.read()
                await context.bot.send_message(chat_id=update.effective_chat.id, text=file_content)

        os.remove(ip_list_path)
        os.remove(reachable_path)
        os.remove(unreachable_path)
        globals.is_command_running = False
        return ConversationHandler.END


def ip_valid(file_path):
    ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    ips = set()

    with open(file_path, 'r') as file:
        for line in file:
            if line.strip():
                found_ips = re.findall(ip_pattern, line)
                ips.update(found_ips)

    with open(file_path, 'w') as file:
        file.write('\n'.join(ips))

    return False if not ips else True


def ping_ip():

    def ping(ip):
        try:
            output = subprocess.check_output(
                ["ping", "-n", "3", ip], text=True, stderr=subprocess.STDOUT)
            return ip, True
        except subprocess.CalledProcessError:
            return ip, False

    with open(ip_list_path, 'r') as file:
        ip_list = file.read().splitlines()

    with concurrent.futures.ThreadPoolExecutor() as executor:
        results = executor.map(ping, ip_list)

        reachable_ips = []
        unreachable_ips = []

        for ip, status in results:
            if status:
                reachable_ips.append(ip)
            else:
                unreachable_ips.append(ip)

        reachable_ips.sort()
        unreachable_ips.sort()

        with open(reachable_path, "w") as file_reachable:
            for ip in reachable_ips:
                file_reachable.write(ip + "\n")

        with open(unreachable_path, "w") as file_unreachable:
            for ip in unreachable_ips:
                file_unreachable.write(ip + "\n")
