import machine
import urequests
import network
from picozero import pico_led
import time

# Define the list of servers
last_call_time = time.ticks_ms()
servers = ["http://vedicvarma.com:5000", "http://192.168.205.1:5000","http://192.168.205.157:5000"]
ssid = "Hotspot"
password = "password"

def connect():
    # Connect to WLAN
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    
    # Wait for connection
    max_attempts = 20
    attempt = 0
    while not wlan.isconnected() and attempt < max_attempts:
        print('Waiting for connection...')
        time.sleep(1)
        attempt += 1
    
    if wlan.isconnected():
        print('Connected to WiFi:', wlan.ifconfig())
    else:
        print('Failed to connect to WiFi')
# Create a dynamic dictionary to hold the GPIO pins for the bed LEDs
bed_leds = {}

def initialize_leds():
    global bed_leds
    gpio_pin = 0  # Starting GPIO pin number

    # Loop through each server and initialize LEDs for 5 beds per server
    for server_index, server in enumerate(servers):
        bed_leds[server_index] = {}
        for bed_id in range(1, 4 if server_index<2 else 3):
            red_pin = machine.Pin(gpio_pin, machine.Pin.OUT)
            yellow_pin = machine.Pin(gpio_pin + 1, machine.Pin.OUT)
            if gpio_pin+2 ==23:
                gpio_pin=24
            green_pin = machine.Pin(gpio_pin + 2, machine.Pin.OUT)

            bed_leds[server_index][bed_id] = {
                "red": red_pin,
                "yellow": yellow_pin,
                "green": green_pin
            }

            # Print debug information about the pin assignment
            print(f"Server {server_index}, Bed {bed_id}:\n Red LED {gpio_pin}, Yellow LED {gpio_pin + 1}, Green LED {gpio_pin + 2}")

            gpio_pin += 3  # Move to the next set of GPIO pins

def turn_off_all_leds():
    # Turn off all LEDs for all servers and beds
    for server_beds in bed_leds.values():
        for bed in server_beds.values():
            for color in bed.values():
                color.value(0)  # Turn off all LEDs initially

def set_led_color(server_index, bed_id, status):
    # Set LEDs based on the bed status
    #print(server_index,bed_id,status)
    if bed_id not in bed_leds[server_index]:
        #print(f"Error: Bed ID {bed_id} does not exist for Server {server_index}. Skipping this bed.")
        return
    if status == "Occupied":
        bed_leds[server_index][bed_id]["red"].value(1)
        bed_leds[server_index][bed_id]["yellow"].value(0)
        bed_leds[server_index][bed_id]["green"].value(0)
    elif status == "Reserved":
        bed_leds[server_index][bed_id]["red"].value(0)
        bed_leds[server_index][bed_id]["yellow"].value(1)
        bed_leds[server_index][bed_id]["green"].value(0)
    elif status == "Available":
        bed_leds[server_index][bed_id]["red"].value(0)
        bed_leds[server_index][bed_id]["yellow"].value(0)
        bed_leds[server_index][bed_id]["green"].value(1)
    else:
        # If status is unknown, turn off all LEDs for that bed
        bed_leds[server_index][bed_id]["red"].value(0)
        bed_leds[server_index][bed_id]["yellow"].value(0)
        bed_leds[server_index][bed_id]["green"].value(0)

def check_beds():
    for server_index, server in enumerate(servers):
        try:
            print(f"Sending Request to {server}",end='')
            response = urequests.get(f"{server}/beds?filters=bedID>0,bedID<4", timeout=15)
            
            if response.status_code == 200:
                try:
                    beds = response.json()
                    for bed in beds:
                        bed_id = bed[0]
                        status = bed[3]
                        set_led_color(server_index, bed_id, status)
                except ValueError as ve:
                    print(f"❌\nJSON parsing error from server {server}: {ve}")
            else:
                print(f"❌\nError {response.status_code} from server: {server}")

        except OSError as e:
            print(f"❌\nNetwork error connecting to server {server}: {e}")
        #except Exception as e:
        #    print(f"Failed to connect to server {server}: {e}")
        finally:
            try:
                response.close()
                print('✅')
            except:
                print("Failed to close the response properly.")
        #time.sleep(0.1)
        
        
def test_leds():
    # Define the list of all GPIO pins used for LEDs
    led_pins = list(range(0, 23)) +[26]	  # GPIO pins 0-22 and 26-28
    
    # Create a list of Pin objects for each LED
    led_objects = [machine.Pin(pin, machine.Pin.OUT) for pin in led_pins]
    led_objects=led_objects[::-1]
    
    # Iterate through each LED pin and test it
    for led in led_objects:
        print(f"Testing LED on pin {led}")
        
        # Turn on the LED
        led.value(1)
        time.sleep(0.05)  # Wait for 500 ms
        
        # Turn off the LED
        led.value(0)
        time.sleep(0.5)  # Wait for another 500 ms


test_leds()

connect()

# Initialize GPIO pins for LEDs
initialize_leds()
# Turn off all LEDs initially
turn_off_all_leds()
#print(bed_leds)
# Main loop to check beds periodically every 5 seconds
while True:
    current_time = time.ticks_ms()
    if not time.ticks_diff(current_time, last_call_time) >= 1000:
        continue
    pico_led.toggle()
    check_beds()
    time.sleep(0.1)
    #time.sleep(1)  # Check every 5 seconds
