from PIL import Image, ImageOps

def make_transparent_white(input_path, output_path):
    # Open the image and convert to grayscale
    img = Image.open(input_path).convert("L")
    
    # Invert the grayscale image (so lines are white, background is black)
    # The original image has black/dark lines on a white background.
    # Inverting makes lines white (high value) and background black (low value).
    inverted = ImageOps.invert(img)
    
    # Create a new image with pure white color (255, 255, 255)
    # and use the inverted image as the alpha channel
    white_img = Image.new("RGBA", img.size, (255, 255, 255, 255))
    white_img.putalpha(inverted)
    
    # Optional: We can enhance the contrast of the alpha channel to make the lines sharper
    # and remove any slight gray background artifacts
    alpha = white_img.getchannel('A')
    # Thresholding: any value below 50 becomes 0 (fully transparent), 
    # any value above 100 becomes more opaque.
    alpha = alpha.point(lambda p: 0 if p < 80 else int((p - 80) * (255 / (255 - 80))))
    white_img.putalpha(alpha)
    
    # Save the result
    white_img.save(output_path, "PNG")

if __name__ == "__main__":
    make_transparent_white(r"d:\SwimLogix\frontend\assets\swimmer.jpg", r"d:\SwimLogix\frontend\assets\swimmer.png")
