`timescale 1ns/1ps

module tb_relu_u8;

reg  [7:0] x;
wire [7:0] y;

relu_u8 uut (
    .x(x),
    .y(y)
);

initial begin
    x = 8'd0;
    #10;

    x = 8'd5;
    #10;

    x = 8'd35;
    #10;

    x = 8'd128;
    #10;

    x = 8'd255;
    #10;

    $finish;
end

endmodule